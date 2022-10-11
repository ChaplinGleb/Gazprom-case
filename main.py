from random import uniform, random, randint
from time import time

from fastapi import FastAPI, Depends, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import SessionLocal, Sensor, SensorHistory, Company, Process, Conflict, fill_db
from history import gen_next_value, generate_history

ERROR_COUNTER = 5
NORMAL_COUNTER = 20
fill_db()
app = FastAPI()
app.mount("/www", StaticFiles(directory="www"), name="www")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/", response_class=HTMLResponse)
async def index():
    with open('www/index.html', mode='r', encoding='utf-8') as html:
        return html.read()


@app.get("/sensors")
async def root(db: Session = Depends(get_db)):
    ret = {'data': []}
    for sensor in db.query(Sensor).all():
        x_timestamps = []
        y_values = []
        for history in db.query(SensorHistory).filter_by(sensor_id=sensor.id).all():
            x_timestamps.append(history.timestamp)
            y_values.append(history.value)
        data = {
            "id": sensor.id,
            "title": sensor.title,
            "unit": sensor.unit,
            "priority": sensor.priority,
            "min_critical": sensor.min_critical,
            "max_critical": sensor.max_critical,
            "history": {
                'x': x_timestamps,
                'y': y_values
            }
        }
        ret['data'].append(data)
    return ret


@app.get("/organizations")
async def organisations(db: Session = Depends(get_db)):
    data = [
        {
            'title': company.title,
            'stars': company.stars,
            'geo': company.geo,
            'km': company.km,
            'completed': company.completed
        }
        for company in db.query(Company).all()
    ]
    return {'data': data}


@app.get("/processes")
async def processes(db: Session = Depends(get_db)):
    ret = {'data': []}
    for process in db.query(Process).all():
        sensor = db.query(Sensor).filter_by(id=process.sensor_id).first()
        if process.company_current_id == process.company_1_id:
            company_1 = db.query(Company).filter_by(id=process.company_1_id).first()
            company_2 = db.query(Company).filter_by(id=process.company_2_id).first()
            company = {
                'title': company_1.title,
                'stars': company_1.stars,
                'geo': company_1.geo,
                'completed': company_1.completed,
                'price': sensor.price * company_1.markup,
            }
            competitive_company = {
                'title': company_2.title,
                'stars': company_2.stars,
                'geo': company_2.geo,
                'completed': company_2.completed,
                'price': sensor.price * company_2.markup,
            }
        else:
            company_1 = db.query(Company).filter_by(id=process.company_2_id).first()
            company = {
                'title': company_1.title,
                'stars': company_1.stars,
                'geo': company_1.geo,
                'completed': company_1.completed,
                'price': sensor.price * company_1.markup,
            }
            competitive_company = {}
        data = {
            'id': process.id,
            'rig': process.rig,
            'sensor': sensor.title,
            'priority': sensor.priority,
            'max_step': process.max_step,
            'current_step': process.current_step,
            'company': company,
            'competitive company': competitive_company
        }
        ret['data'].append(data)
    return ret


@app.get("/conflicts")
async def conflicts(db: Session = Depends(get_db)):
    ret = {'data': []}
    for conflict in db.query(Conflict).all():
        sensor = db.query(Sensor).filter_by(id=conflict.sensor_id).first()
        if sensor.priority == 1:
            priority = Company.completed.desc()
        elif sensor.priority == 2:
            priority = Company.km.asc()
        elif sensor.priority == 3:
            priority = Company.stars.desc()
        elif sensor.priority == 4:
            priority = Company.markup.asc()
        else:
            priority = Company.completed.desc()
        companies_list = []
        companies = db.query(Company).order_by(priority).limit(8).all()
        for company in companies:
            companies_list.append({
                'id': company.id,
                'title': company.title,
                'stars': company.stars,
                'geo': company.geo,
                'km': company.km,
                'completed': company.completed,
                'price': sensor.price * company.markup
            })

        data = {
            'id': conflict.id,
            'rig': conflict.rig,
            'sensor': sensor.title,
            'priority': sensor.priority,
            'deviation': conflict.deviation,
            'deviation_percent': conflict.deviation_percent,
            'date': conflict.date,
            'companies': companies_list
        }
        ret['data'].append(data)
    return ret


@app.post("/break_sensor")
async def break_sensor(request: Request, db: Session = Depends(get_db)):
    json_request = await request.json()
    if not json_request or not json_request.get('id'):
        return {'error': "Can't read json"}
    sensor = db.query(Sensor).filter_by(id=json_request['id']).first()
    if not sensor:
        return {'error': "Can't find sensor"}
    values = []
    deviation = abs(sensor.max_critical - sensor.min_critical) * uniform(0.05, 0.15)
    if random() < .5:
        min_value = sensor.min_critical - deviation
        max_value = sensor.min_critical - deviation / 50
        trend = 'min'
    else:
        min_value = sensor.max_critical + deviation / 50
        max_value = sensor.max_critical + deviation
        trend = 'max'
    current_value = uniform(min_value, max_value)
    values.append(current_value)
    for i in range(ERROR_COUNTER - 1):
        current_value = gen_next_value(current_value, min_value, max_value)
        values.append(current_value)
    last_timestamp = (db.query(SensorHistory)
                      .filter_by(sensor_id=sensor.id)
                      .order_by(SensorHistory.id.desc())
                      .first()).timestamp
    timestamps = [i for i in range(last_timestamp + 1, last_timestamp + ERROR_COUNTER + 1)]
    for i in range(ERROR_COUNTER):
        new_history = SensorHistory(sensor_id=sensor.id, timestamp=timestamps[i], value=values[i])
        db.add(new_history)
        db.commit()
    one_percent = abs(sensor.max_critical - sensor.min_critical) / 100
    if trend == 'min':
        deviation = -abs(sensor.min_critical - min(values))
    else:
        deviation = max(values) - sensor.max_critical
    deviation_percent = round(deviation / one_percent, 2)
    new_conflict = Conflict(sensor_id=sensor.id, deviation=deviation, deviation_percent=deviation_percent)
    db.add(new_conflict)
    db.commit()
    return {'id': sensor.id, 'values': values, 'timestamps': timestamps}

@app.post("/change_step")
async def change_step(request: Request, db: Session = Depends(get_db)):
    json_request = await request.json()
    if not json_request or not json_request.get('id'):
        return {'error': "Can't read json"}
    process = db.query(Process).filter_by(id=json_request['id']).first()
    if not process:
        return {'error': "Can't find process"}
    if not json_request.get('step') or not isinstance(json_request.get('step'), int):
        return {'error': "Unknown step"}
    step = int(json_request.get('step'))
    if step < 0 or step > process.max_step:
        return {'error': "Unknown step"}

    if step == process.max_step:
        company = db.query(Company).filter_by(id=process.company_current_id).first()
        company.completed = Company.completed + 1
        db.commit()

        db.delete(process)
        db.commit()

        sensor = db.query(Sensor).filter_by(id=process.sensor_id).first()
        time_now = int(time())
        x_timestamp = [i for i in range(time_now - NORMAL_COUNTER, time_now)]
        y_values = generate_history(sensor.min_critical, sensor.max_critical, NORMAL_COUNTER)
        for i in range(NORMAL_COUNTER):
            new_history = SensorHistory(sensor_id=sensor.id, timestamp=x_timestamp[i], value=y_values[i])
            db.add(new_history)
            db.commit()
    else:
        process.current_step = step
        db.commit()


@app.post("/create_process")
async def create_process(request: Request, db: Session = Depends(get_db)):
    json_request = await request.json()
    if not json_request or not json_request.get('conflict_id'):
        return {'error': "Can't read json"}
    conflict = db.query(Conflict).filter_by(id=json_request['conflict_id']).first()
    if not conflict:
        return {'error': "Can't find conflict"}
    if not json_request.get('company_1') or not json_request.get('company_2'):
        return {'error': "Unknown company"}
    if not json_request.get('company_1').isdigit() or not json_request.get('company_2').isdigit():
        return {'error': "Unknown company"}
    company_1 = db.query(Company).filter_by(id=int(json_request.get('company_1'))).first()
    company_2 = db.query(Company).filter_by(id=int(json_request.get('company_2'))).first()
    if not company_1 or not company_2:
        return {'error': "Unknown company"}
    new_process = Process(sensor_id=conflict.sensor_id, company_1_id=company_1.id, company_2_id=company_2.id,
                          company_current_id=company_1.id, max_step=randint(3, 6), current_step=1)
    db.add(new_process)
    db.commit()
    db.delete(conflict)
    db.commit()


@app.post("/change_company")
async def change_company(request: Request, db: Session = Depends(get_db)):
    json_request = await request.json()
    if not json_request or not json_request.get('process_id'):
        return {'error': "Can't read json"}
    process = db.query(Process).filter_by(id=json_request['process_id']).first()
    if not process:
        return {'error': "Can't find process"}
    if process.company_current_id == process.company_2_id:
        return {'error': "Can't change company"}
    process.company_current_id = process.company_2_id
    db.commit()


@app.post("/cancel_process")
async def cancel_process(request: Request, db: Session = Depends(get_db)):
    json_request = await request.json()
    if not json_request or not json_request.get('process_id'):
        return {'error': "Can't read json"}
    process = db.query(Process).filter_by(id=json_request['process_id']).first()
    if not process:
        return {'error': "Can't find process"}

    sensor = db.query(Sensor).filter_by(id=process.sensor_id).first()
    one_percent = abs(sensor.max_critical - sensor.min_critical) / 100
    last_history = (db.query(SensorHistory)
                    .filter_by(sensor_id=sensor.id)
                    .order_by(SensorHistory.id.desc())
                    .limit(ERROR_COUNTER)
                    .all())
    values = [i.value for i in last_history]
    if values[0] > sensor.max_critical:
        deviation = max(values) - sensor.max_critical
    else:
        deviation = -abs(sensor.min_critical - min(values))
    deviation_percent = round(deviation / one_percent, 2)
    new_conflict = Conflict(sensor_id=process.sensor_id, deviation=deviation, deviation_percent=deviation_percent)
    db.add(new_conflict)
    db.commit()

    db.delete(process)
    db.commit()
