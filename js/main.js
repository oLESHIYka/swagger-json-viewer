const JSON_VIEWER_PATH = chrome.runtime.getURL("/icons/json.png");
const JSON_VIEWER_BUTTON_BACKGROUND = "url(\"" + JSON_VIEWER_PATH + "\") 50% no-repeat";

// ====================================================
// Обработчики нажатий

// Функция ожидает на вход кнопку просмотра JSON'а.
// Если кнопка не была нажата:
//   Создаёт объект jsonViewer, если его ещё нет.
//   Считывает данные из Response Body, если это валидный JSON скрывает стандартный вывод и отображает jsonViewer.
//   Если не валидный -  alert.
// Если была нажата:
//    Скрыть jsonViewer
function showJSONViewer(button){
    let parent = $(button).parent()
    let highlightCodeBlock = parent.parent();

    highlightCodeBlock.toggleClass("json-viewer-selected");

    if ( highlightCodeBlock.hasClass("json-viewer-selected") ) {
        if ( highlightCodeBlock.find(".json-viewer").length === 0 ) {
            highlightCodeBlock.append("<pre class=\"json-viewer\"></pre>")
        }

        if ( highlightCodeBlock.find(".json-viewer").length > 0 ) {
            let val;
            try {
                response = highlightCodeBlock.find("pre.microlight").text();

                if (response.length > 0) {
                    val = JSON.parse(response);
        
                    highlightCodeBlock.find(".json-viewer").jsonViewer(val, {withQuotes: true, rootCollapsable: false, collapsed: true});
                }
            } catch (exp) {
                highlightCodeBlock.removeClass("json-viewer-selected");

                alert('Не JSON!');
            }
        }
    }
}

function addJsonViewerButton(responseInnerDiv) {
    $(responseInnerDiv).find(".highlight-code").append(
        "<div class=\"json-viewer-button\"><button></button></div>"
    );

    let button = $(responseInnerDiv).find(".highlight-code > .json-viewer-button > button");
    button.css("background", JSON_VIEWER_BUTTON_BACKGROUND)
    button.on("click", function(){
        showJSONViewer(this);
    });
}


// ====================================================
// Обработчики

const TIMEOUT = 100;

// Задание обработчика нажатия кнопки Execute
function executeBtnSetHandler(opblock, button) {
    if ( $(button).attr('data-json-viewer-handeled') !== 'true' ) {
        $(button).attr('data-json-viewer-handeled', 'true');

        $(button).on("click", function(){
            // По клику нужно наблюдать на добавлением блока ответа
            if ( $(opblock).find( ".responses-wrapper > .responses-inner" ).length > 0 ) {
                // Скрываем json-viewer при повторном запросе
                $(opblock).find( ".responses-wrapper > .responses-inner > div .response .highlight-code" ).removeClass("json-viewer-selected");
        
                let observer = new MutationObserver((records) => {
                    records.forEach(function (record) {
                        var list = record.addedNodes;
                        var i = list.length - 1;
        
                        for ( ; i > -1; i-- ) {
                          if (list[i].nodeName === 'DIV') {
                            addJsonViewerButton(list[i]);
                          }
                        }
                      });
                });
                let targetNode = $(opblock).find( ".responses-wrapper > .responses-inner" ).get(0);
        
                observer.observe(targetNode, { childList: true, subtree: false });
            }

            // Поиск блока Response body
            responseBodyScanner(opblock);
        });
    }
}

// Задание обработчика нажатия кнопки Try it out
function tryItOutBtnSetHandler(opblock, button) {
    if ( $(button).attr('data-json-viewer-handeled') !== 'true' ) {
        $(button).attr('data-json-viewer-handeled', 'true');

        $(button).on("click", function(){
            // Поиск кнопки Execute
            executeBtnScanner(opblock);

            // Поиск блока Response body
            responseBodyScanner(opblock);
        });
    }
}

// Задание обработчика по нажатию на заголовок блока ручек.
function operationBlockSetHandler(opblock) {
    $(opblock).find(".opblock-summary").on("click", function(){
        operationBlockScanner(opblock);
    });
}

// Задание обработчика нажатия на заголовок секции ручек. По нажатию на заголовок звать сканер секции.
function operationsSectionSetHandler(section) {
    $(section).find(".opblock-tag").on("click", function() {
        operationsSectionScanner(section);
    });
}

// ====================================================
// Сканеры

 // Сканер Response body. Ищет ответ проверяет наличие кнопки и блока json-viewer'а и добавляет их при необходимости.
function responseBodyScanner(block) {
    setTimeout(() => {
        $(block).find(".opblock-body .response .highlight-code").each(function(idx){
            //  Если блок ответа есть, а кнопки нет - добавить кнопку
            if ( $(this).find(".json-viewer-button").length == 0 ) {
                addJsonViewerButton($(block).find(".live-responses-table"));
            }
        });
    }, TIMEOUT);
}

// Сканнер кнопки Execute. Ищет Response body.
function executeBtnScanner(block) {
    // console.log('executeBtnScanner...');

    setTimeout(() => {
        $(block).find(".opblock-body button.execute").each(function(idx){
            executeBtnSetHandler(block, this)
        });
    }, TIMEOUT);
}

// Сканнер кнопки Try it out. Смотрит на состоние кнопки Try it out и ищет кнопку Execute
function tryItOutBtnScanner(block) {
    setTimeout(() => {
        $(block).find(".opblock-body .try-out__btn").each(function(idx){
            //tryItOutClickHandler(blockId, this);
            tryItOutBtnSetHandler(block, this)
        });
    }, TIMEOUT);
}

// Сканер блока ручки. Ищет кнопку Try it out и задаёт ей обработчик + зовёт сканер.
function operationBlockScanner(block) {
    // Поиск кнопки Try it out
    tryItOutBtnScanner(block);

    // Поиск кнопки Execute
    executeBtnScanner(block);

    // Поиск блока Response body
    responseBodyScanner(block);
}

// Сканер секции ручек. На вход ожидает секцию, сканирует её в поиске блоков ручек.
// Каждому блоку задаёт обработчик и зовёт сканер блока ручки.
function operationsSectionScanner(operationsSection) {
    setTimeout(() => {
        $(operationsSection).find(".opblock").each(function(idx) {
            operationBlockSetHandler(this); // Задаём обработчик нажатия на заголовок ручки
            operationBlockScanner(this); // Сканируем ручку на предмет наличия конпки Try it out.
        });
    }, TIMEOUT);
}

// Сканер верхнего уровня. Сканирует все группы (секции) ручек.
// Задаёт каждой секции обработчик нажатия и зовёт сканер секции.
function operationsBlockSectionsScanner() {
    setTimeout(() => {
        $(".swagger-ui .opblock-tag-section").each(function(idx){
            operationsSectionSetHandler(this); // Вешаем обработчик нажатия на секцию
            operationsSectionScanner(this); // Сканируем секцию
        });
    }, TIMEOUT);
}

// ====================================================
// Начальный обход

setTimeout(() => {
    operationsBlockSectionsScanner();
}, 500);