import json
from time import time

from sqlalchemy import create_engine, Column, Float, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from history import generate_history

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    stars = Column(Integer)
    geo = Column(String)
    km = Column(Integer)
    completed = Column(Integer)
    markup = Column(Integer)


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    unit = Column(String)
    priority = Column(Integer)
    min_critical = Column(Float)
    max_critical = Column(Float)
    price = Column(Integer)


class SensorHistory(Base):
    __tablename__ = "sensors_history"

    id = Column(Integer, primary_key=True)
    sensor_id = Column(Integer)
    timestamp = Column(Integer)
    value = Column(Float)


class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True)
    rig = Column(String, default='Сибур 1')
    sensor_id = Column(Integer)
    company_1_id = Column(Integer)
    company_2_id = Column(Integer)
    company_current_id = Column(Integer)
    max_step = Column(Integer)
    current_step = Column(Integer)


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True)
    rig = Column(String, default='Сибур 1')
    sensor_id = Column(Integer)
    deviation = Column(Float)
    deviation_percent = Column(Float)
    date = Column(Integer, default=time)


def fill_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with open('data.json', encoding='utf-8') as f:
        data = json.load(f)
        db = SessionLocal()
        for company in data['companies']:
            new_company = Company(title=company['title'], stars=company['stars'], geo=company['geo'], km=company['km'],
                                  completed=company['completed'], markup=company['markup'])
            db.add(new_company)
            db.commit()
        for sensor in data['sensors']:
            new_sensor = Sensor(title=sensor['title'], unit=sensor['unit'], priority=sensor['priority'],
                                min_critical=sensor['min_critical'], max_critical=sensor['max_critical'],
                                price=sensor['price'])
            db.add(new_sensor)
            db.commit()
        for sensor in db.query(Sensor).all():
            counter = 20
            time_now = int(time())
            x_timestamp = [i for i in range(time_now - counter, time_now)]
            y_values = generate_history(sensor.min_critical, sensor.max_critical, counter)
            for i in range(counter):
                new_history = SensorHistory(sensor_id=sensor.id, timestamp=x_timestamp[i], value=y_values[i])
                db.add(new_history)
                db.commit()
        db.close()
