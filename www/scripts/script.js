let color = {
    blue: '#0074BA',
    grey: '#7C7C7C',
    red: '#FF4F4F',
}
let arrCharts = []
const main = document.querySelector('main .wrapper.main')

function request(url) {
    $.ajax({
        type: 'GET',
        url: `/${url}`,
        crossDomain: true,
        success: function(responseData, textStatus, jqXHR) {
            generatePage(url, responseData.data)
        },
        error: function (responseData, textStatus, errorThrown) {
            console.log(responseData);
            console.log(textStatus);
            console.log(errorThrown);
        }
    });
}
function openPanel() {
    document.querySelectorAll('.panel__header').forEach(el => {
        el.addEventListener('click', function() {
            this.classList.toggle('active')
    
            let block = this.nextElementSibling
            if (block.style.height){
                block.style.height = null
            } else {
                block.style.height = block.scrollHeight + "px"
            } 
        })
    })
}
function convertDate(timestamp) {
    let date = new Date(timestamp * 1000)
    let day = date.getDate()
    let month = date.getMonth()
    let year = date.getFullYear()
    let sec = date.getSeconds()
    let min = date.getMinutes()
    let hour = date.getHours()
    day < 10 ? day = '0' + String(day) : day
    month < 10 ? month = '0' + String(month) : month
    sec < 10 ? sec = '0' + String(sec) : sec
    min < 10 ? min = '0' + String(min) : min
    hour < 10 ? hour = '0' + String(hour) : hour

    return day + '.' + month + '.' + year + ' ' + hour + ':' + min + ':' + sec
}
function break_sensor(id) {
    $.ajax({
        type: 'POST',
        url: '/break_sensor',
        data: JSON.stringify({"id": id}),
        success: function (data) {
            update_data(data)
        },
        contentType: "application/json",
        dataType: 'json'
    });
}
function create_process(id, index) {
    let MajorBlock = document.querySelector(`#setedMajor-${index}`)
    let SubBlock = document.querySelector(`#setedSub-${index}`)
    if (MajorBlock.innerHTML != 'Основаная компания...' && SubBlock.innerHTML != 'Запасная компания...') {
        const company_1_id = document.getElementById('setedMajor-' + index).getAttribute('data-id')
        const company_2_id = document.getElementById('setedSub-' + index).getAttribute('data-id')
        $.ajax({
            type: 'POST',
            url: '/create_process',
            data: JSON.stringify({"conflict_id": id, 'company_1': company_1_id, 'company_2': company_2_id}),
            success: function (data) {
                $(`#panel-${index}`).fadeOut()
            },
            contentType: "application/json",
            dataType: 'json'
        });
    }
}
function update_data(data) {
    let id = data.id - 1
    
    // update chart
    let labels =  arrCharts[id].config['_config'].data.labels
    for (let i = 0; i < data.timestamps.length; i++) {
        labels.push(convertDate(data.timestamps[i]))
    }
    let value = data.values
    for (let i = 0; i < value.length; i++) {
        arrCharts[id].config['_config'].data.datasets[0].data.push(value[i])
        arrCharts[id].config['_config'].data.datasets[1].data.push(arrCharts[id].config['_config'].data.datasets[1].data[0])
        arrCharts[id].config['_config'].data.datasets[2].data.push(arrCharts[id].config['_config'].data.datasets[2].data[0])
    }
    arrCharts[id].update()

    // update table
    document.querySelector(`table tbody tr:nth-child(${id + 1}) td.value`).innerHTML = Math.round(arrCharts[id].config['_config'].data.datasets[0].data[arrCharts[id].config['_config'].data.datasets[0].data.length - 1]).toLocaleString('ru-RU')

    // update max and min
    let avarage = 0
    for (let i = 0; i < arrCharts[id].config['_config'].data.datasets[0].data.length; i++) {
        avarage += arrCharts[id].config['_config'].data.datasets[0].data[i]
        
    }
    document.querySelector(`#createError-${id}`).parentElement.querySelector(`#max`).innerHTML = Math.round(Math.max.apply(null, arrCharts[id].config['_config'].data.datasets[0].data)).toLocaleString('ru-RU')
    document.querySelector(`#createError-${id}`).parentElement.querySelector(`#min`).innerHTML = Math.round(Math.min.apply(null, arrCharts[id].config['_config'].data.datasets[0].data)).toLocaleString('ru-RU')
    document.querySelector(`#createError-${id}`).parentElement.querySelector(`#avarage`).innerHTML = Math.round(avarage / arrCharts[id].config['_config'].data.datasets[0].data.length).toLocaleString('ru-RU')
}
function generatePage(id, database) {
    let title, priority, completed, geo, stars, panel, rig, prevDisabled,
    container = main.querySelector(`#block-${id}`)

    // hide and clear active block 
    activeBlock = document.querySelector('.container.active')
    activeBlock.style.display = 'none'
    activeBlock.classList.remove('active')
    activeBlock.innerHTML = ''
    
    // create table
    if (id == 'sensors') {
        panel = `
        <div class="panel">
            <div class="panel__header">
                <p class="block__title" id="title">Сводная таблица показателей</p>
                <svg width="100%" viewBox="0 0 30 20" fill="currentColor">
                    <path d="M13.962 18.7286L1.6286 6.39522C0.776144 5.54277 0.776144 4.16433 1.6286 3.32094L3.67812 1.27142C4.53058 0.418966 5.90901 0.418966 6.7524 1.27142L15.4946 10.0136L24.2368 1.27142C25.0893 0.418966 26.4677 0.418966 27.3111 1.27142L29.3606 3.32094C30.2131 4.1734 30.2131 5.55184 29.3606 6.39522L17.0272 18.7286C16.1929 19.5811 14.8145 19.5811 13.962 18.7286V18.7286Z" fill="currentColor"/>
                </svg>
            </div>
            <div class="panel__body">
                <div class="block">
                    <table>
                        <thead>
                            <tr>
                                <th>Название датчика</th>
                                <th>Приоритет</th>
                                <th>Значение</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`
            
        container.innerHTML = panel
    }

    // generating needed page depending on id
    switch(id) {
        case 'sensors':
            let dataChart = []

            // get and set data
            for (let i = 0; i < database.length; i++) {
                let labels = []
                let criticalMax = []
                let criticalMin = []
                table = document.querySelector('tbody')
                title = database[i].title + ', ' + database[i].unit
                priority = database[i].priority
                let data = database[i].history.y
                let DataResult = 0
                let DataLast = Math.round(database[i].history.y[database[i].history.y.length - 1]).toLocaleString('ru-RU')
                for (let i = 0; i < data.length; i++) {
                    DataResult += data[i]
                }
                
                panel = `
                <div class="panel">
                    <div class="panel__header">
                        <p class="block__title" id="title">${title}</p>
                        <svg width="100%" viewBox="0 0 30 20" fill="currentColor">
                            <path d="M13.962 18.7286L1.6286 6.39522C0.776144 5.54277 0.776144 4.16433 1.6286 3.32094L3.67812 1.27142C4.53058 0.418966 5.90901 0.418966 6.7524 1.27142L15.4946 10.0136L24.2368 1.27142C25.0893 0.418966 26.4677 0.418966 27.3111 1.27142L29.3606 3.32094C30.2131 4.1734 30.2131 5.55184 29.3606 6.39522L17.0272 18.7286C16.1929 19.5811 14.8145 19.5811 13.962 18.7286V18.7286Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="panel__body">
                        <div class="block">
                            <div class="block__column">
                                <div class="block__row">
                                    <p class="block__text">Приоритет:</p>
                                    <p class="block__value" id="priority">${priority}</p>
                                </div>
                                <div class="block__row">
                                    <p class="block__text">Максимальное значение:</p>
                                    <p class="block__value" id="max">${Math.round(Math.max.apply(null, database[i].history.y)).toLocaleString('ru-RU')}</p>
                                </div>
                                <div class="block__row">
                                    <p class="block__text">Минимальное значение:</p>
                                    <p class="block__value" id="min">${Math.round(Math.min.apply(null, database[i].history.y)).toLocaleString('ru-RU')}</p>
                                </div>
                                <div class="block__row">
                                    <p class="block__text">Среднее значение:</p>
                                    <p class="block__value" id="avarage">${Math.round(DataResult / data.length).toLocaleString('ru-RU')}</p>
                                </div>
                                <div class="block__chart">
                                    <canvas id="chart-${i}"></canvas>
                                </div>
                                <button class="createError" id="createError-${i}" onclick="break_sensor(${database[i].id})">Имитировать поломку</button>
                            </div>
                        </div>
                    </div>
                </div>`
                tableHTML = `
                <tr>
                    <td class="title">${title}</td>
                    <td class="priority">${priority}</td>
                    <td class="value">${DataLast}</td>
                </tr>`

                // get data for charts
                for (let b = 0; b < database[i].history.x.length; b++) {
                    labels.push(convertDate(database[i].history.x[b]))
                    criticalMax.push(database[i].max_critical)
                    criticalMin.push(database[i].min_critical)
                }
                // (criticalMax[0] - criticalMin[0]) * 0.3
                dataChart.push({
                    'labels': labels,
                    'data': database[i].history.y,
                    'max_critical': criticalMax,
                    'min_critical': criticalMin,
                    'limitMax': criticalMax[0] + (criticalMax[0] - criticalMin[0]) * 0.2,
                    'limitMin': criticalMin[0] - (criticalMax[0] - criticalMin[0]) * 0.2,
                })

                table.innerHTML += tableHTML
                container.innerHTML += panel
            }

            // setting charts
            let charts = document.querySelectorAll('canvas')
            for (let i = 0; i < charts.length; i++) {
                let config = {
                    type: 'line',
                    data: {
                        labels: dataChart[i]['labels'],
                        datasets: [{
                            label: '',
                            data: dataChart[i]['data'],
                            backgroundColor: color.blue,
                            borderColor: color.blue,
                        },
                        {
                            label: '',
                            data: dataChart[i]['max_critical'],
                            backgroundColor: color.red,
                            borderColor: color.red,
                            pointRadius: 0,
                        },
                        {
                            label: '',
                            data: dataChart[i]['min_critical'],
                            backgroundColor: color.red,
                            borderColor: color.red,
                            pointRadius: 0,
                        }]
                    },
                    options: {
                        tension: 0.3,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            zoom: {
                                zoom: {
                                    wheel: {
                                        enabled: true,
                                    },
                                    pinch: {
                                        enabled: true
                                    }
                                },
                                pan: {
                                    enabled: true
                                },
                                limits: {
                                    y: {min: dataChart[i]['limitMin'], max: dataChart[i]['limitMax']},
                                    y2: {min: dataChart[i]['limitMin'], max: dataChart[i]['limitMax']}
                                }
                            }
                        }
                    }
                }
                arrCharts.push(
                    new Chart(
                        charts[i],
                        config
                    )
                )
                
            }
            break;
        
        case 'conflicts':
            // get and set data
            for (let i = 0; i < database.length; i++) {
                let compHTML = ''
                rig = database[i].rig
                // console.log(database)
                sensor = database[i].sensor
                priority = database[i].priority
                deviation = database[i].deviation_percent
                date = convertDate(database[i].date)
                let companies = database[i].companies
                let counterID = 0
                for(key in companies) {
                    title = companies[key].title
                    completed = companies[key].completed
                    geo = companies[key].geo
                    stars = companies[key].stars
                    price = companies[key].price.toLocaleString('ru-RU')
                    compHTML += `
                    <div class="block__column block__row-company" id="company-${counterID}">
                        <div class="block__column">
                            <div class="block__row">
                                <p class="block__text">Название:</p>
                                <p class="block__value" id="titleCompany-${counterID}">${title}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Колличество выполненных заказов:</p>
                                <p class="block__value">${completed}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Местоположение:</p>
                                <p class="block__value">${geo}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Качество работы:</p>
                                <p class="block__value">${stars}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Стоимость услуг:</p>
                                <p class="block__value">${price} ₽</p>
                            </div>
                        </div>
                        <div class="block__row block__row-btn-block">
                            <button class="block__btn-choose-company major" name="btn-${i}" data-id="${companies[key].id}" id="setMajor-${counterID}">Выбрать основной</button>
                            <button class="block__btn-choose-company sub" name="btn-${i}" data-id="${companies[key].id}" id="setSub-${counterID}">Выбрать запасной</button>
                        </div>
                    </div>`
                    counterID++
                }
                panel = `
                <div class="panel" id="panel-${i}">
                    <div class="panel__header">
                        <div class="block__column">
                            <p class="block__title">${rig}</p>
                            <div class="block__row block__row-title">
                                <p class="block__title">${sensor}</p>
                                <div class="counter blue">${priority}</div>
                                <div class="counter red">${deviation}%</div>
                            </div>
                        </div>
                        <div class="block__row block__row-date">
                            <p class="block__title">${date}</p>
                            <svg width="100%" viewBox="0 0 30 20" fill="currentColor">
                                <path d="M13.962 18.7286L1.6286 6.39522C0.776144 5.54277 0.776144 4.16433 1.6286 3.32094L3.67812 1.27142C4.53058 0.418966 5.90901 0.418966 6.7524 1.27142L15.4946 10.0136L24.2368 1.27142C25.0893 0.418966 26.4677 0.418966 27.3111 1.27142L29.3606 3.32094C30.2131 4.1734 30.2131 5.55184 29.3606 6.39522L17.0272 18.7286C16.1929 19.5811 14.8145 19.5811 13.962 18.7286V18.7286Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                    <div class="panel__body">
                        <div class="block" id="block-${i}">
                            <div class="block__column">
                                <div class="block__row block__row-seted-company-block">
                                    <div class="block__row-seted-company">
                                        <p id="setedMajor-${i}">Основаная компания...</p>
                                        <div class="block__row-btn-clear" id="clearMajor">
                                            <svg width="100%" style="" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C9.18479 0 6.00537 1.31696 3.66117 3.66117C1.31696 6.00537 0 9.18479 0 12.5L0 87.5C0 90.8152 1.31696 93.9946 3.66117 96.3388C6.00537 98.683 9.18479 100 12.5 100H87.5C90.8152 100 93.9946 98.683 96.3388 96.3388C98.683 93.9946 100 90.8152 100 87.5V12.5C100 9.18479 98.683 6.00537 96.3388 3.66117C93.9946 1.31696 90.8152 0 87.5 0L12.5 0ZM33.4625 29.0375L50 45.5813L66.5375 29.0375C66.828 28.7469 67.173 28.5165 67.5526 28.3592C67.9322 28.202 68.3391 28.1211 68.75 28.1211C69.1609 28.1211 69.5678 28.202 69.9474 28.3592C70.327 28.5165 70.672 28.7469 70.9625 29.0375C71.2531 29.328 71.4835 29.673 71.6408 30.0526C71.798 30.4322 71.8789 30.8391 71.8789 31.25C71.8789 31.6609 71.798 32.0678 71.6408 32.4474C71.4835 32.827 71.2531 33.172 70.9625 33.4625L54.4187 50L70.9625 66.5375C71.2531 66.828 71.4835 67.173 71.6408 67.5526C71.798 67.9322 71.8789 68.3391 71.8789 68.75C71.8789 69.1609 71.798 69.5678 71.6408 69.9474C71.4835 70.327 71.2531 70.672 70.9625 70.9625C70.672 71.2531 70.327 71.4835 69.9474 71.6408C69.5678 71.798 69.1609 71.8789 68.75 71.8789C68.3391 71.8789 67.9322 71.798 67.5526 71.6408C67.173 71.4835 66.828 71.2531 66.5375 70.9625L50 54.4187L33.4625 70.9625C33.172 71.2531 32.827 71.4835 32.4474 71.6408C32.0678 71.798 31.6609 71.8789 31.25 71.8789C30.8391 71.8789 30.4322 71.798 30.0526 71.6408C29.673 71.4835 29.328 71.2531 29.0375 70.9625C28.7469 70.672 28.5165 70.327 28.3592 69.9474C28.202 69.5678 28.1211 69.1609 28.1211 68.75C28.1211 68.3391 28.202 67.9322 28.3592 67.5526C28.5165 67.173 28.7469 66.828 29.0375 66.5375L45.5813 50L29.0375 33.4625C28.4507 32.8757 28.1211 32.0798 28.1211 31.25C28.1211 30.4202 28.4507 29.6243 29.0375 29.0375C29.6243 28.4507 30.4202 28.1211 31.25 28.1211C32.0798 28.1211 32.8757 28.4507 33.4625 29.0375V29.0375Z" fill="currentColor"/>
        </svg>
                                        </div>
                                    </div>
                                    <div class="block__row-seted-company">
                                        <p id="setedSub-${i}">Запасная компания...</p>
                                        <div class="block__row-btn-clear" id="clearSub">
                                            <svg width="100%" style="" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C9.18479 0 6.00537 1.31696 3.66117 3.66117C1.31696 6.00537 0 9.18479 0 12.5L0 87.5C0 90.8152 1.31696 93.9946 3.66117 96.3388C6.00537 98.683 9.18479 100 12.5 100H87.5C90.8152 100 93.9946 98.683 96.3388 96.3388C98.683 93.9946 100 90.8152 100 87.5V12.5C100 9.18479 98.683 6.00537 96.3388 3.66117C93.9946 1.31696 90.8152 0 87.5 0L12.5 0ZM33.4625 29.0375L50 45.5813L66.5375 29.0375C66.828 28.7469 67.173 28.5165 67.5526 28.3592C67.9322 28.202 68.3391 28.1211 68.75 28.1211C69.1609 28.1211 69.5678 28.202 69.9474 28.3592C70.327 28.5165 70.672 28.7469 70.9625 29.0375C71.2531 29.328 71.4835 29.673 71.6408 30.0526C71.798 30.4322 71.8789 30.8391 71.8789 31.25C71.8789 31.6609 71.798 32.0678 71.6408 32.4474C71.4835 32.827 71.2531 33.172 70.9625 33.4625L54.4187 50L70.9625 66.5375C71.2531 66.828 71.4835 67.173 71.6408 67.5526C71.798 67.9322 71.8789 68.3391 71.8789 68.75C71.8789 69.1609 71.798 69.5678 71.6408 69.9474C71.4835 70.327 71.2531 70.672 70.9625 70.9625C70.672 71.2531 70.327 71.4835 69.9474 71.6408C69.5678 71.798 69.1609 71.8789 68.75 71.8789C68.3391 71.8789 67.9322 71.798 67.5526 71.6408C67.173 71.4835 66.828 71.2531 66.5375 70.9625L50 54.4187L33.4625 70.9625C33.172 71.2531 32.827 71.4835 32.4474 71.6408C32.0678 71.798 31.6609 71.8789 31.25 71.8789C30.8391 71.8789 30.4322 71.798 30.0526 71.6408C29.673 71.4835 29.328 71.2531 29.0375 70.9625C28.7469 70.672 28.5165 70.327 28.3592 69.9474C28.202 69.5678 28.1211 69.1609 28.1211 68.75C28.1211 68.3391 28.202 67.9322 28.3592 67.5526C28.5165 67.173 28.7469 66.828 29.0375 66.5375L45.5813 50L29.0375 33.4625C28.4507 32.8757 28.1211 32.0798 28.1211 31.25C28.1211 30.4202 28.4507 29.6243 29.0375 29.0375C29.6243 28.4507 30.4202 28.1211 31.25 28.1211C32.0798 28.1211 32.8757 28.4507 33.4625 29.0375V29.0375Z" fill="currentColor"/>
        </svg>
                                        </div>
                                    </div>
                                </div>
                                ${compHTML}
                                <button class="confirm" id="confirm-${i}" onclick="create_process(${database[i].id}, ${i})">Подтвердить выбор</button>
                            </div>
                        </div>
                    </div>
                </div>`

                container.innerHTML += panel
            }

            // setting btn
            document.querySelectorAll('.block__btn-choose-company').forEach(el => {
                el.addEventListener('click', function() {
                    let id = this.name.split('-')[1]
                    let FullId = this.id
                    let MajorBlock = document.querySelector(`#setedMajor-${id}`)
                    let SubBlock = document.querySelector(`#setedSub-${id}`)
                    let ClearMajor = MajorBlock.nextElementSibling
                    let ClearSub = SubBlock.nextElementSibling
                    let counterID = this.id.split('-')[1]
                    let title = document.querySelector(`#titleCompany-${counterID}`).innerText
                    if (FullId.startsWith('setMajor') && SubBlock.innerText != title) {
                        MajorBlock.innerText = title
                        MajorBlock.setAttribute("data-id", this.getAttribute('data-id'));
                        $(ClearMajor).fadeIn()
                    }else if(FullId.startsWith('setSub') && MajorBlock.innerText != title) {
                        SubBlock.innerText = title
                        SubBlock.setAttribute("data-id", this.getAttribute('data-id'));
                        $(ClearSub).fadeIn()
                    }
                    
                })
            })
            document.querySelectorAll('.block__row-btn-clear').forEach(el => {
                el.addEventListener('click', function(){
                    let id = el.id
                    if (id == 'clearMajor') {
                        el.previousElementSibling.innerText = 'Основаная компания...'
                    }else {
                        el.previousElementSibling.innerText = 'Запасная компания...'
                    }
                    $(el).fadeOut()
                })
            })
            break;
        
        case 'processes':
            // get and set data
            for (let i = 0; i < database.length; i++) {
                let stepHTML = ''
                rig = database[i].rig
                sensor = database[i].sensor
                priority = database[i].priority
                currentStep = database[i].current_step
                maxStep = database[i].max_step
                let progress = (100 / (maxStep - 1)) * (currentStep - 1)

                let curComp = {
                    'title': database[i].company.title,
                    'completed': database[i].company.completed,
                    'geo': database[i].company.geo,
                    'stars': database[i].company.stars,
                    'price': database[i].company.price.toLocaleString('ru-RU'),
                }

                let contrCompHTML = ''
                var isContr = Object.keys(database[i]['competitive company']).length > 0 ? true : false 
                if (isContr) {
                    var contrComp = {
                        'title': database[i]['competitive company'].title,
                        'completed': database[i]['competitive company'].completed,
                        'geo': database[i]['competitive company'].geo,
                        'stars': database[i]['competitive company'].stars,
                        'price': database[i]['competitive company'].price.toLocaleString('ru-RU'),
                    }
                    contrCompHTML = `
                        <div class="block__column block__row-company hidden" id="subCompany-${i}">
                            <div class="block__row">
                                <p class="block__text">Название:</p>
                                <p class="block__value">${contrComp['title']}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Колличество выполненных заказов:</p>
                                <p class="block__value">${contrComp['completed']}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Местоположение:</p>
                                <p class="block__value">${contrComp['geo']}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Качество работы:</p>
                                <p class="block__value">${contrComp['stars']}</p>
                            </div>
                            <div class="block__row">
                                <p class="block__text">Стоимость услуг:</p>
                                <p class="block__value">${contrComp['price']} ₽</p>
                            </div>
                        </div>`
                }
                
                currentStep == 1 ? prevDisabled = 'disabled' : prevDisabled = ''
                for (let i = 1; i <= maxStep; i++) {
                    if (i <= currentStep) {
                        stepHTML += `
                        <div class="steps__one-step active">
                            <div class="steps__circle">${i}</div>
                            <p>Этап</p>
                        </div>`
                    } else {
                        stepHTML += `
                        <div class="steps__one-step">
                            <div class="steps__circle">${i}</div>
                            <p>Этап</p>
                        </div>`
                    } 
                }

                panel = `
                <div class="panel">
                    <div class="panel__header">
                        <div class="block__column">
                            <p class="block__title">${rig}</p>
                            <div class="block__row block__row-title">
                                <p class="block__title">${sensor}</p>
                                <div class="counter blue">${priority}</div>
                            </div>
                        </div>
                        <div class="block__row block__row-date">
                            <p class="block__title" id="currentStep-${i}">${currentStep} этап</p>
                            <svg width="100%" viewBox="0 0 30 20" fill="currentColor">
                                <path d="M13.962 18.7286L1.6286 6.39522C0.776144 5.54277 0.776144 4.16433 1.6286 3.32094L3.67812 1.27142C4.53058 0.418966 5.90901 0.418966 6.7524 1.27142L15.4946 10.0136L24.2368 1.27142C25.0893 0.418966 26.4677 0.418966 27.3111 1.27142L29.3606 3.32094C30.2131 4.1734 30.2131 5.55184 29.3606 6.39522L17.0272 18.7286C16.1929 19.5811 14.8145 19.5811 13.962 18.7286V18.7286Z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                    <div class="panel__body" id="body-${i}">
                        <div class="block">
                            <div class="block__column">
                                <div class="block__column" id="majorCompany-${i}">
                                    <div class="block__row">
                                        <p class="block__text">Название:</p>
                                        <p class="block__value">${curComp['title']}</p>
                                    </div>
                                    <div class="block__row">
                                        <p class="block__text">Колличество выполненных заказов:</p>
                                        <p class="block__value">${curComp['completed']}</p>
                                    </div>
                                    <div class="block__row">
                                        <p class="block__text">Местоположение:</p>
                                        <p class="block__value">${curComp['geo']}</p>
                                    </div>
                                    <div class="block__row">
                                        <p class="block__text">Качество работы:</p>
                                        <p class="block__value">${curComp['stars']}</p>
                                    </div>
                                    <div class="block__row">
                                        <p class="block__text">Стоимость:</p>
                                        <p class="block__value">${curComp['price']} ₽</p>
                                    </div>
                                </div>
                                <div class="steps" id="steps-${i}">
                                    <div class="steps__container">
                                        <div class="steps__progress" id="progress-${i}" style="width: ${progress}%;"></div>
                                        ${stepHTML}
                                    </div>
                                    <div class="steps__btn-block">
                                        <button class="prev" id="prev-${i}" ${prevDisabled} data-id="${database[i].id}">
                                            <svg width="100%" viewBox="0 0 22 23" fill="currentColor">
                                                <path d="M12.6302 20.8553L11.5463 21.9393C11.0873 22.3983 10.3451 22.3983 9.89099 21.9393L0.398804 12.452C-0.0601806 11.993 -0.0601806 11.2509 0.398804 10.7968L9.89099 1.30457C10.35 0.845581 11.0922 0.845581 11.5463 1.30457L12.6302 2.38855C13.0941 2.85242 13.0844 3.60925 12.6107 4.06335L6.72693 9.66882H20.7601C21.4095 9.66882 21.932 10.1913 21.932 10.8407V12.4032C21.932 13.0526 21.4095 13.5751 20.7601 13.5751H6.72693L12.6107 19.1805C13.0892 19.6346 13.099 20.3915 12.6302 20.8553Z" fill="currentColor"/>
                                            </svg>
                                        </button>
                                        <button class="err" id="err-${i}">
                                            <svg width="100%" viewBox="0 0 100 100" fill="currentColor">
                                                <path d="M43.4375 2.71875C47.0625 -0.90625 52.9375 -0.90625 56.5625 2.71875L97.2812 43.4438C100.906 47.0688 100.906 52.9375 97.2812 56.5562L56.5625 97.2813C52.9375 100.906 47.0687 100.906 43.45 97.2813L2.71875 56.5625C1.85665 55.7022 1.17269 54.6802 0.70602 53.5552C0.239354 52.4302 -0.000853685 51.2242 -0.000853685 50.0063C-0.000853685 48.7883 0.239354 47.5823 0.70602 46.4573C1.17269 45.3323 1.85665 44.3103 2.71875 43.45L43.4375 2.71875ZM52.1875 7.09375C51.6073 6.51363 50.8205 6.18772 50 6.18772C49.1795 6.18772 48.3927 6.51363 47.8125 7.09375L7.0875 47.8125C6.50738 48.3927 6.18147 49.1795 6.18147 50C6.18147 50.8205 6.50738 51.6073 7.0875 52.1875L47.8125 92.9125C48.3927 93.4926 49.1795 93.8185 50 93.8185C50.8205 93.8185 51.6073 93.4926 52.1875 92.9125L92.9125 52.1875C93.4926 51.6073 93.8185 50.8205 93.8185 50C93.8185 49.1795 93.4926 48.3927 92.9125 47.8125L52.1875 7.0875V7.09375Z" fill="currentColor"/>
                                                <path d="M43.7625 68.75C43.7625 67.9292 43.9242 67.1165 44.2383 66.3582C44.5523 65.5999 45.0127 64.9109 45.5931 64.3306C46.1734 63.7502 46.8624 63.2898 47.6207 62.9758C48.379 62.6617 49.1917 62.5 50.0125 62.5C50.8333 62.5 51.646 62.6617 52.4043 62.9758C53.1626 63.2898 53.8515 63.7502 54.4319 64.3306C55.0123 64.9109 55.4727 65.5999 55.7867 66.3582C56.1008 67.1165 56.2625 67.9292 56.2625 68.75C56.2625 70.4076 55.604 71.9973 54.4319 73.1694C53.2598 74.3415 51.6701 75 50.0125 75C48.3549 75 46.7652 74.3415 45.5931 73.1694C44.421 71.9973 43.7625 70.4076 43.7625 68.75ZM44.375 31.2188C44.2918 30.4303 44.3752 29.6331 44.62 28.8789C44.8648 28.1248 45.2653 27.4305 45.7957 26.8412C46.3261 26.2518 46.9745 25.7806 47.6988 25.458C48.4231 25.1354 49.2071 24.9688 50 24.9688C50.7929 24.9688 51.5769 25.1354 52.3012 25.458C53.0255 25.7806 53.6739 26.2518 54.2043 26.8412C54.7347 27.4305 55.1352 28.1248 55.38 28.8789C55.6248 29.6331 55.7082 30.4303 55.625 31.2188L53.4375 53.1375C53.364 53.9986 52.97 54.8007 52.3335 55.3852C51.6969 55.9697 50.8642 56.2941 50 56.2941C49.1358 56.2941 48.3031 55.9697 47.6665 55.3852C47.03 54.8007 46.636 53.9986 46.5625 53.1375L44.375 31.2188Z" fill="currentColor"/>
                                            </svg>
                                        </button>
                                        <button class="next" id="next-${i}" data-id="${database[i].id}">
                                            <svg width="100%" viewBox="0 0 22 23" fill="currentColor">
                                                <path d="M9.35633 2.38855L10.4403 1.30456C10.8993 0.845578 11.6415 0.845578 12.0956 1.30456L21.5878 10.7919C22.0468 11.2509 22.0468 11.993 21.5878 12.4471L12.0956 21.9393C11.6366 22.3983 10.8944 22.3983 10.4403 21.9393L9.35632 20.8553C8.89246 20.3915 8.90222 19.6346 9.37585 19.1805L15.2596 13.5751L1.22644 13.5751C0.577027 13.5751 0.0545662 13.0526 0.0545663 12.4032L0.0545664 10.8407C0.0545665 10.1913 0.577027 9.66882 1.22644 9.66882L15.2596 9.66882L9.37586 4.06335C8.89734 3.60925 8.88758 2.85241 9.35633 2.38855Z" fill="currentColor"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                ${contrCompHTML}
                                <button class="block__btn-choose-company hidden" id="setMajor-${i}" data-id="${database[i].id}">Выбрать основной</button>
                                <button class="block__btn-cancel hidden" id="cencel-${i}" data-id="${database[i].id}">Отменить</button>
                            </div>
                        </div>
                    </div>
                </div>`
                
                container.innerHTML += panel
            }

            function moveSteps(btn) {
                let id = btn.id.split('-')[1]
                const data_id = btn.getAttribute('data-id')
                let stepBlock = document.querySelector(`#steps-${id}`)
                let activeCircles = stepBlock.querySelectorAll('.steps__one-step.active')
                let currentStep = activeCircles.length
                let maxStep = stepBlock.querySelectorAll('.steps__one-step').length
                let progress = stepBlock.querySelector(`#progress-${id}`)

                if (btn.id.split('-')[0] == 'prev'){
                    currentStep--
                    activeCircles[currentStep].classList.remove('active')
                    currentStep == 1 ? btn.setAttribute('disabled', true) : ''
                    stepBlock.querySelector(`#next-${id}`).removeAttribute('disabled')
                } else {
                    currentStep++
                    stepBlock.querySelectorAll('.steps__one-step')[currentStep - 1].classList.add('active')
                    currentStep == maxStep ? $(`#body-${id}`).parent().fadeOut() : ''
                    stepBlock.querySelector(`#prev-${id}`).removeAttribute('disabled')
                }

                $.ajax({
                    type: 'POST',
                    url: '/change_step',
                    data: JSON.stringify({"id": data_id, 'step': currentStep}),
                    success: function (data) {},
                    contentType: "application/json",
                    dataType: 'json'
                });
                
                document.querySelector(`#currentStep-${id}`).innerHTML = currentStep + ' этап'
                progress.style.width = (100 / (maxStep - 1)) * (currentStep - 1) + '%'
            }

            // settings btn of steps
            document.querySelectorAll('button.prev').forEach(el => {
                el.addEventListener('click', function() {
                    moveSteps(this)
                })
            })    
            document.querySelectorAll('button.next').forEach(el => {
                el.addEventListener('click', function() {
                    moveSteps(this)
                })
            })    
            document.querySelectorAll('button.err').forEach(el => {
                el.addEventListener('click', function() {
                    let id = this.id.split('-')[1]
                    
                    document.querySelectorAll(`#body-${id} .steps__one-step.active`).forEach(el => {
                        el.classList.add('error')
                    })
                    document.querySelector(`#progress-${id}`).style.background = '#FF4F4F'

                    if(isContr){
                        document.querySelector(`#subCompany-${id}`).classList.remove('hidden')
                        document.querySelector(`#setMajor-${id}`).classList.remove('hidden')
                        document.querySelector(`#body-${id}`).style.height = document.querySelector(`#body-${id}`).scrollHeight + "px"
                        this.setAttribute('disabled', true)
                        this.nextElementSibling.setAttribute('disabled', true)
                        this.previousElementSibling.setAttribute('disabled', true)
                    } else {
                        this.setAttribute('disabled', true)
                        this.nextElementSibling.setAttribute('disabled', true)
                        this.previousElementSibling.setAttribute('disabled', true)
                        document.querySelector(`#cencel-${id}`).classList.remove('hidden')
                        document.querySelector(`#body-${id}`).style.height = document.querySelector(`#body-${id}`).scrollHeight + "px"
                    } 
                })
            })
            document.querySelectorAll('button.block__btn-choose-company').forEach(el => {
                el.addEventListener('click', function(){
                    let id = this.id.split('-')[1]

                    document.querySelectorAll(`#body-${id} .steps__one-step.active`).forEach(el => {
                        el.classList.remove('error')
                    })
                    document.querySelector(`#progress-${id}`).style.background = '#0074BA'

                    let subInfo = document.querySelectorAll(`#subCompany-${id} .block__value`)
                    let subCompany = []
                    subInfo.forEach(el => {
                        subCompany.push(el.innerHTML)
                    })
                    let majorInfo = document.querySelectorAll(`#majorCompany-${id} .block__value`)
                    for (let i = 0; i < majorInfo.length; i++) {
                        majorInfo[i].innerHTML = subCompany[i]
                    }
                    this.previousElementSibling.classList.add('hidden')
                    this.previousElementSibling.remove()
                    this.classList.add('hidden')
                    this.remove()
                    document.querySelector(`#body-${id}`).style.height = Number(document.querySelector(`#body-${id}`).style.height.replace('px', '')) - 211 + 'px'
                    document.querySelector(`#prev-${id}`).removeAttribute('disabled')
                    document.querySelector(`#err-${id}`).removeAttribute('disabled')
                    document.querySelector(`#next-${id}`).removeAttribute('disabled')
                    isContr = false

                    $.ajax({
                        type: 'POST',
                        url: '/change_company',
                        data: JSON.stringify({"process_id": el.getAttribute('data-id')}),
                        success: function (data) {},
                        contentType: "application/json",
                        dataType: 'json'
                    });
                })
            })
            document.querySelectorAll('button.block__btn-cancel').forEach(el => {
                el.addEventListener('click', function() {
                    let id = this.id.split('-')[1]
                    $.ajax({
                        type: 'POST',
                        url: '/cancel_process',
                        data: JSON.stringify({"process_id": el.getAttribute('data-id')}),
                        success: function (data) {
                            $(`#body-${id}`).parent().fadeOut()
                        },
                        contentType: "application/json",
                        dataType: 'json'
                    });
                })
            })
            break;
        
        case 'organizations':
            // get and set data
            for (let i = 0; i < database.length; i++) {
                title = database[i].title
                completed = database[i].completed
                geo = database[i].geo
                stars = database[i].stars
                panel = `
                <div class="panel">
                    <div class="panel__header">
                        <p class="block__title" id="panel-title">${title}</p>
                        <svg width="100%" viewBox="0 0 30 20" fill="currentColor">
                            <path d="M13.962 18.7286L1.6286 6.39522C0.776144 5.54277 0.776144 4.16433 1.6286 3.32094L3.67812 1.27142C4.53058 0.418966 5.90901 0.418966 6.7524 1.27142L15.4946 10.0136L24.2368 1.27142C25.0893 0.418966 26.4677 0.418966 27.3111 1.27142L29.3606 3.32094C30.2131 4.1734 30.2131 5.55184 29.3606 6.39522L17.0272 18.7286C16.1929 19.5811 14.8145 19.5811 13.962 18.7286V18.7286Z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="panel__body">
                        <div class="block">
                            <div class="block__column">
                                <div class="block__row">
                                    <p class="block__text">Колличество выполненных заказов:</p>
                                    <p class="block__value" id="panel-complited">${completed}</p>
                                </div>
                                <div class="block__row">
                                    <p class="block__text">Местоположение:</p>
                                    <p class="block__value" id="panel-geo">${geo}</p>
                                </div>
                                <div class="block__row">
                                    <p class="block__text">Качество работы:</p>
                                    <p class="block__value" id="panel-stars">${stars}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
                
                container.innerHTML += panel
            }
            break;
    }

    // show needed block
    container.style.display = 'flex'
    container.classList.add('active')
    openPanel()
}
request('sensors')
openPanel()

// listen nav's clicks
const nav = document.querySelector('.header .nav')
nav.querySelectorAll('p').forEach(el => {
    el.addEventListener('click', function() {
        nav.querySelector('.active').classList.remove('active')
        this.classList.add('active')
        const id = (el.id).split('-')[1]
        
        request(id)
    })
})
