/** setMap
 * Возвращает карту:
 * center_coords - координаты центра
 * zoom          - зум
 */

function setMap(center_coords, zoom) {
        var Map = new ymaps.Map(
            "YMapsID", {
                center: center_coords,
                zoom: zoom,
                controls: ['fullscreenControl']
            }, {
                minZoom: 6,
                maxZoom: 10
            }
        );
        return Map;
    }
    /** createPlacemark
     * Возвращает метку:
     * placemark_coords - координаты метки
     * hint_name        - заголовок подсказки
     * hint_description - текст подсказки
     * balloon_info     - текст балуна
     */

function createPlacemark(placemark_coords, hint_name, hint_description, balloon_info) {
        Placemark = new ymaps.Placemark(placemark_coords, {
            name: hint_name,
            description: hint_description,
            hintContent: '<b>' + hint_description + '</b><br>' + hint_name,
            balloonContent: balloon_info
        }, {
            draggable: false,
            balloonCloseButton: true,
            balloonMaxHeight: 800
        });
        return Placemark;
    }
    /** createBorder
     * Возвращает линию (границу):
     * border_coords - массив координат (в Base64)
     * stroke_color  - цвет границы
     * stroke_width  - ширина границы
     */

function createBorder(border_coords, stroke_color, stroke_width) {
    BorderGeometry = ymaps.geometry.LineString.fromEncodedCoordinates(border_coords);
    Border = new ymaps.Polyline(
        BorderGeometry, {
            hintContent: ""
        }, //попробовать без
        {
            strokeColor: stroke_color,
            strokeWidth: stroke_width
        }
    );
    return Border;
}

/** createNewLayout
 * Возвращает новый шаблон (layout)
 * html - хтмл-код для шаблона
 */

function createNewLayout(html) {
    var NewLayout = ymaps.templateLayoutFactory.createClass(html);
    return NewLayout;
}

/** setBalloonStyle
 * Возвращает стиль балуна:
 * balloon_layout_name - шаблон (layout)
 */

function setBalloonStyle(balloon_layout_name) {
    var BalloonContentStyle = ymaps.templateLayoutFactory.createClass(
        '$[[' + balloon_layout_name + ']]', {
            build: function() {
                BalloonContentStyle.superclass.build.call(this);
                $(".ymaps-b-balloon__tl, .ymaps-b-balloon__bl, .ymaps-b-balloon__br").css("display", "none");
                $(".close").on("click", $.proxy(this._onCloseButtonClick, this));
            },
            _onCloseButtonClick: function(e) {
                e.preventDefault();
                this.events.fire('userclose');
            }
        }
    );
    return BalloonContentStyle;
}

/** createCollection
 * Возвращает коллекцию:
 * hint_layout       - шаблон подсказки
 * balloon_style     - стиль балуна
 * icon_image_href   - путь иконки метки
 * icon_image_size   - размер иконки метки
 * icon_image_offset - сдвиг иконки
 */

function createCollection(hint_layout, balloon_style, icon_image_href, icon_image_size, icon_image_offset) {
    var NewCollection = new ymaps.GeoObjectCollection({}, {
        hintContentLayout: hint_layout,
        balloonContentLayout: balloon_style,
        iconLayout: 'default#image',
        iconImageHref: icon_image_href,
        iconImageSize: icon_image_size,
        iconImageOffset: icon_image_offset
    });
    return NewCollection;
}


/** addCollectionToMenu
 * Добавляет кнопку управления коллекцией в меню:
 * collection    - коллекция
 * balloon_style - текст кнопки в меню
 */

function addCollectionToMenu(collection, menu_title) {
    $("<li class=\"turquoiseColor MenuContent MenuMap activ\"><a class=\"MenuElement\">" + menu_title + "</a></li>")
        .on("click", function() {
            var menu_element = $(this);
            collection.options.set('visible', (menu_element.hasClass("activ") ? false : true));
            menu_element.toggleClass("activ");
            return false;
        }).appendTo("#menu");
}

/** setButtonsOnClickEvents
 * Вешает события на кнопки управления картой:
 * Map - карта
 */

function setButtonsOnClickEvents(Map) {
    $("#ZoomDecreaseButId").click(function() {
        Map.setZoom(Map.getZoom() - 1)
    });
    $("#ZoomIncreaseButId").click(function() {
        Map.setZoom(Map.getZoom() + 1)
    });
}

/** setRegions
 * При наведении курсора на область,
   границы области подсвечиваются:
 * Map - карта
 */

function setRegions(Map) {
    var lastActiveRegion, needChange = false;
    ymaps.regions.load('UA', {
        lang: 'ru',
        quality: 2
    }).then(function(result) {
        var regions = result.geoObjects;
        regions.options.set({
            fillOpacity: 0,
            opacity: 0,
            zIndex: 1,
            zIndexHover: 1
        });
        regions.events.add('mouseenter', function(event) {
            var target = event.get('target');
            if (lastActiveRegion != target) {
                if (lastActiveRegion)
                    lastActiveRegion.options.set('preset', '');
                lastActiveRegion = target;
                needChange = true;
            }
            if (needChange) {
                lastActiveRegion.options.set('preset', {
                    strokeWidth: 3,
                    strokeColor: '#ff000099',
                    opacity: 1
                });
                needChange = false;
            }
        });
        regions.events.add('click', function(event) {
            var target = event.get('target');
            for (var i = 0; i < YMap.regions.names.length; i++) {
                if (target.properties.get('hintContent') == YMap.regions.names[i]) {
                    var myAction = new ymaps.map.action.Single({
                        center: YMap.regions.centers[i],
                        zoom: 8,
                        duration: 200,
                        timingFunction: "ease-in"
                    });

                    Map.action.execute(myAction);
                }
            }
        });
        Map.geoObjects.add(regions);
    });
}

/** handleIcon
 * Настройка кнопок
 */

function handleIcon(Map, p_id) {
    $("#YMapsLink").click(function() {
        document.location.href = "aMDOMap.html?" + (p_id ? ("p_id=" + p_id + '&') : '') + "ll=" + Map.getCenter().toString();
    });
    $('#YM_AllMap').click(function(ev) {
        ev.preventDefault();

        var myAction = new ymaps.map.action.Single({
            center: YMap.center,
            zoom: 6,
            duration: 200,
            timingFunction: "ease-in"
        });

        Map.action.execute(myAction);
    });
}
