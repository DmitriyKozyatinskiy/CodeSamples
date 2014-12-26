var DocNotes = DocNotes || {};

DocNotes.saveNote = function(date) {
    var selection_container = $(document.getSelection().focusNode.parentNode),
        note_html = $.selection('html'),
        note_text = $.selection('text'),
        container = $('.note-container');
    if (note_html == '') {
        alert('Выделите текст!');
        return;
    }
    if (!selection_container.hasClass("note-container") && selection_container.parents(".note-container").length == 0) {
        if (container.hasClass('news-text'))
            alert("Вы можете сделать заметку только по тексту новости или коментария!");
        else if (container.hasClass('Forum-text'))
            alert("Вы можете сделать заметку только по тексту сообщения!");
        else
            alert("Вы можете сделать заметку только по тексту документа!");
        return;
    }
    if (note_text.length < 5) {
        alert('Минимальный размер заметки - 5 символов!');
        return;
    }
    /*Удаление старых заметок*/
    var old_id_arr = DocNotes.getSelectionInnerIDs(note_html),
        old_id_count = old_id_arr.length;
    if (old_id_count > 0) {
        if (!confirm('Обнаружено пересечение заметок! Желаете удалить старые заметки?')) {
            return;
        } else {
            for (var i = 0; i < old_id_count; i++) {
                ajax_get('aMDODocNotes.deleteNote?p_id=' + old_id_arr[i]);
                DocNotes.removeNoteMarks(old_id_arr[i]);
            }
        }
    }
    /*------------------------------------------------*/
    /*Добавление заметки в базу и пометка цветом*/
    note_html = DocNotes.removeNoteMarksFromSelection(note_html); //.replace(/<p[^>]*>/i, '');
    var is_start_tag_found = true,
        is_end_tag_found = true;
    while (is_start_tag_found) {
        if (note_html.indexOf('<') == 0)
            note_html = note_html.replace(/<[^\/][^>]*>/i, '');
        else
            is_start_tag_found = false;
    }
    while (is_end_tag_found) {
        if (note_html.substr(note_html.length - 1, 1) == '>')
            note_html = note_html.replace(/<\/[^>]*>$/i, '');
        else
            is_end_tag_found = false;
    }
    //.replace(/<\/p>$/i, '');
    var p_arr = note_html.split('</p>'),
        p_count = p_arr.length,
        new_html;
    for (var i = 0; i < p_count; i++) {
        if (i == 0 || i == p_count - 1) {
            p_arr[i] = DocNotes.handleSelectedLinks(p_arr[i]);
        }
        //if (i == p_count - 1)
        //p_arr[i] = p_arr[i].replace(/<\/.*>$/i, '');
        container.each(function() {
            var that = $(this);
            that.html(that.html().replace(p_arr[i], '<font class=Doc-note--highlighted data-id=0>' + p_arr[i] + '</font>'));
        });
    }
    new_html = p_arr.join('</p>');
    var form = $('#doc_note_form');
    form.find('input[name=p_text]').val(new_html.replace(/<\/p>$/i, ''));
    DocNotes.handleNoteSave(form[0]);
    /*------------------------------------------------*/
    window.getSelection().removeAllRanges();
}

DocNotes.noteReplace = function() {
    var container = $(".note-container");
    for(var id in DocNotes.Notes) {
        container.each(function() {
            var that = $(this);
            that.html(that.html().replace(DocNotes.Notes[id], '<font class="Doc-note Doc-note--highlighted" data-id="' + id + '">' + DocNotes.Notes[id] + '</font>'));
        });
    }}


DocNotes.handleNoteSave = function(t, e) {
    var that = $(t),
        d = that.formSerialize(null, "cp1251");
    var jqxhr = $.ajax({
        url: that.attr("action") || e,
        dataType: "json",
        type: that.attr("method") || "POST",
        data: d + (d == "" ? "" : "&") + "json=1",
        beforeSend: function() {
            ajaxFormBeforSubmit.call(that)
        }
    });
    jqxhr.done(function(data) {
        ajax_encode(data);
        if (data.id) {
            modal.show({
                backdrop: true,
                siz: "md"
            });
            modal.setTitle("Добавление ссылки на заметку в кейс");
            $.get("aMDODocNotes.putNoteInCase?p_note_id=" + data.id, function(d) {
                modal.setBody(d);
                modal.setFooter({
                    html: "<button class='Btn' type='button' onClick='ajax_submit_form($(\"#save_note_form\")[0]);'>Сохранить</button>",
                    append: "<button class='Btn' type='button' onClick='modal.hide();'>Закрыть</button>",
                    show: true
                });
            });
        }
    });
    jqxhr.fail(function() {
        ajaxFormError.call(that)
    });
    return false;
}


DocNotes.handleSelectedLinks = function(note_html) {
    var temp_div = $("<div/>").html(note_html),
        container = $(".note-container"),
        html = temp_div.html().replace(/<\/p>$/i, '');
    if (temp_div.find("a").length == 0 || container.html().indexOf(html) != -1) {
        return note_html;
    }
    if (container.html().indexOf(html.replace(/<\/a>$/i, '')) != -1) {
        return note_html.replace(/<\/a>$/i, '');
    } else if (container.html().indexOf(html.replace(/<a[^>]*>/i, '')) != -1) {
        return note_html.replace(/<a[^>]*>/i, '');
    }
    return note_html;
}

DocNotes.toggleDocNotes = function(t) {
    var that = $(t),
        type = that.attr('data-type'),
        title_show = 'Показать заметки',
        title_hide = 'Скрыть заметки',
        img_plus = '/images/plus.gif',
        img_minus = '/images/minus.gif';
    if (type == 'all') {
        if (that.attr('data-opened') == '1') {
            that.attr({
                'src': img_plus,
                'title': 'Показать все заметки заметки',
                'data-opened': '0'
            });
            $('.toggle-img:not(:first)').attr({
                'src': img_plus,
                'title': title_show,
            });
            $('.Notes-list').hide();
        } else {
            that.attr({
                'src': img_minus,
                'title': 'Скрыть все заметки',
                'data-opened': '1'
            });
            $('.toggle-img:not(:first)').attr({
                'src': img_minus,
                'title': title_hide,
            });
            $('.Notes-list').show();
        }
    } else {
        var note_row = that.parents('.Notes-doc').find('.Notes-list');
        if (note_row.is(':visible')) {
            that.find(".toggle-img").attr({
                'src': img_plus,
                'title': title_show
            });
        } else {
            that.find('.toggle-img').attr({
                'src': img_minus,
                'title': title_hide
            });
        }
        note_row.toggle();
    }
}

DocNotes.addNoteToPanel = function(id, text) {
    var div = $('<div/>', {
        'class': 'Notes-item',
        'onClick': 'DocNotes.scrollToNote(this)',
        'data-id': id,
        html: text
    }).append($('<img/>', {
        'src': '/images/icon-remove-black.png',
        'title': 'Удалить заметку',
        'onClick': "var note_id=$(this).parents('.Notes-item').attr('data-id');if(confirm('Вы действительно желаете заметку?')){ajax_get('aMDODocNotes.deleteNote?p_id=' + note_id);}"
    }));
    div.appendTo(".Notes-list");
    var notes_count_span = $(".Notes-all span");
    notes_count_span.html(parseInt(notes_count_span.html()) + 1);
}

DocNotes.removeNoteMarks = function(id) {
    var html, text, container = $('.note-container');
    if (id != 0) {
        container.find($('font[data-id=' + id + ']')).each(function() {
            html = $('<div/>').html($(this).clone()).html();
            text = $(this).html();
            $(container).html(container.html().replace(html, text));
        });
    } else {
        container.find($('font')).each(function() {
            html = $('<div/>').html($(this).clone()).html();
            text = $(this).html();
            $(container).html(container.html().replace(html, text));
        });
    }
}

DocNotes.removeNoteMarksFromSelection = function(note_html) {
    return note_html.replace(/<\/?font[^>]*>/gi, '');
}

DocNotes.getSelectionInnerIDs = function(selection) {
    var font_arr = selection.split("</font>"),
        id_temp_arr = [],
        id_arr = [];
    for (var i = 0; i < font_arr.length; i++) {
        id_temp_arr[i] = $("<div/>").html(font_arr[i]).find("font").attr("data-id");
        if (id_temp_arr[i] != undefined) {
            id_arr.push(id_temp_arr[i]);
        }
    }
    return id_arr;
}

DocNotes.scrollNote = function() {
    if (window.pageYOffset >= $(".note-container").offset().top) {
        if (!DocNotes.is_fixed) {
            $('.Notes-panel').css({
                'position': 'fixed'
            });
            DocNotes.is_fixed = true;
        }
    } else {
        $('.Notes-panel').css({
            'position': 'absolute'
        });
        DocNotes.is_fixed = false;
    }
};
DocNotes.is_fixed = false;

DocNotes.NotePanelToggle = function(type) {
    type = type || 'docs';
    var panel = $(".Notes-list");
    if (panel.is(":visible")) {
        //panel.slideUp("fast");
        panel.hide();
        $("#note_panel_toggle span").html("Показать заметки");
        $("#note_panel_toggle img").attr("src", "/images/blue_arrow_down.png");
        $(".Notes-panel button img").css("margin", "0");
        if (type == 'docs')
            $(".Notes-panel").removeClass("ml-171");
        else
            $(".Notes-panel").removeClass("ml-172");
    } else {
        panel.show();
        //panel.slideDown("fast");
        $("#note_panel_toggle span").html("Скрыть заметки");
        $("#note_panel_toggle img").attr("src", "/images/blue_arrow_up.png");
        $(".Notes-panel button img").css("margin", "0 86px");
        if (type == 'docs')
            $(".Notes-panel").addClass("ml-171");
        else
            $(".Notes-panel").addClass("ml-172");
    }
};

DocNotes.editComment = function(t, ev) {
    var id = $(t).attr("data-id");
    modal.show({
        backdrop: true,
        siz: "md",
        title: "Комментарий к заметке"
    }, ev);
    $.get('aMDODocNotes.editNoteComment?p_id=' + id, function(d) {
        modal.setBody(d);
        modal.setFooter({
            html: "<button class='Btn' type='button' onClick='ajax_submit_form($(\"#noteCommentForm\")[0]);'>Сохранить</button>",
            show: true
        });
    });
};

DocNotes.scrollToTop = function() {
    $('.Notes-item,.Notes-all').removeClass('Notes-item--highlighted');
    $('.Notes-all').addClass('Notes-item--highlighted');
    $('.Doc-note').addClass('Doc-note--highlighted');
    $('body').scrollTo('.note-container', {
        duration: 'fast'
    });
};

DocNotes.scrollToNote = function(t) {
    var that = $(t),
        id = $(t).attr('data-id');
    if (t) $('.Notes-all,.Notes-item').removeClass('Notes-item--highlighted');
    that.addClass('Notes-item--highlighted');
    if (t) $('.Doc-note').removeClass('Doc-note--highlighted');
    $('.Doc-note[data-id=' + id + ']').addClass('Doc-note--highlighted');
    if (DocNotes.old_id == id) {
        $('body').scrollTo('.Doc-note[data-id=' + id + ']:eq(' + DocNotes.note_num + ')', {
            duration: 'fast'
        });
        DocNotes.note_num++;
    } else {
        DocNotes.note_num = 0;
        $('body').scrollTo('.Doc-note[data-id=' + id + ']:eq(' + DocNotes.note_num + ')', {
            duration: 'fast'
        });
    }
    DocNotes.old_id = id;
};

DocNotes.note_num = 0;
DocNotes.old_id = 0;

$(window).scroll(DocNotes.scrollNote);
DocNotes.scrollNote();

$(function(){DocNotes.noteReplace()});
