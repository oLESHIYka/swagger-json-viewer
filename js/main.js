console.log($(".highlight-code > .microlight"));

const JSON_VIEWER_PATH = chrome.runtime.getURL("/icons/json.png");
const JSON_VIEWER_BUTTON_BACKGROUND = "url(\"" + JSON_VIEWER_PATH + "\") 50% no-repeat";

console.log(JSON_VIEWER_BUTTON_BACKGROUND);

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
                console.log(response);

                if (response.length > 0) {
                    val = JSON.parse(response);
                }
            } catch (exp) {
                alert('Не JSON!');
            }

            console.log(val);

            highlightCodeBlock.find(".json-viewer").jsonViewer(val, {withQuotes: true, rootCollapsable: false, collapsed: true});
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

function executeClickHandler(handleId, button) {
    console.log($("#"+handleId).find(".responses-wrapper > .responses-inner"));

    if ( $( "#"+handleId).find( ".responses-wrapper > .responses-inner" ).length > 0 ) {
        // Скрываем json-viewer при повторном запросе
        $( "#"+handleId).find( ".responses-wrapper > .responses-inner > div .response .highlight-code" ).removeClass("json-viewer-selected");

        let observer = new MutationObserver((records) => {
            console.log(records);
            records.forEach(function (record) {
                console.log(record);
                var list = record.addedNodes;
                var i = list.length - 1;
                
                console.log(list);

                for ( ; i > -1; i-- ) {
                  if (list[i].nodeName === 'DIV') {
                    addJsonViewerButton(list[i]);
                  }
                }
              });
        });
        let targetNode = $( "#"+handleId).find( ".responses-wrapper > .responses-inner" ).get(0);

        observer.observe(targetNode, { childList: true, subtree: false });
    }
}

function tryItOutClickHandler(handleId, button) {
    let wasClicked = $(button).hasClass("cancel");

    if (wasClicked === "true") {
        // Если была нажата, то пока ничего не делаем
    } else {
        // Если не была нажата, то ищем Execute и вешаем обработчик
        setTimeout(() => {
            $("#"+handleId).find("button.execute").on("click", function() {
                executeClickHandler(handleId, this)
            });
        }, 50);
    }

    console.log('Try it out button at ' + handleId + ' clicked. Currently clicked: ' + wasClicked);
}

function headerClickHandler(headerElement){
    let parent = $(headerElement).parent();
    let id = parent.attr('id');

    console.log(id + ' clicked');

    // По таймауту, потому что блок появляется с небольшой задержкой
    setTimeout(() => {
        parent.find(".try-out__btn").on("click", function() {
            tryItOutClickHandler(id, this);
        });
    }, 50);
}

setTimeout(() => {
    $(".swagger-ui .opblock .opblock-summary").on("click", function() {
        headerClickHandler(this);
    });
}, 500);