var Exam = Exam || {};

/*<====TESTS====>*/
Exam.show_test_rules = function() {
    modal.show({
        backdrop: true,
        siz: "md"
    }, event);
    modal.setTitle("Правила прохождения тестов");
    $.get("aMDOTest.TestRules", function(d) {
        modal.setBody(d);
    });
};

Exam.show_test_sessions = function(opened_id) {
    opened_id = opened_id || 0;
    modal.show({
        backdrop: true,
        siz: "lg"
    }, event);
    modal.setTitle("Результаты тестов");
    $.get("aMDOTest.TestSessions", function(d) {
        modal.setBody(d);
        if ($(d).html() != "Вы еще не проходили тесты") {
            modal.setFooter({
                html: "<button class='Btn' type='button' onclick='Exam.delete_results();'>Очистить результаты</button>",
                show: true
            });
        } else {
            modal.chnSize("sm");
        }
        if (opened_id != 0)
            Exam.show_session_result(opened_id);
    });
};

Exam.show_session_result = function(id, without_others) {
    without_others = without_others || 0;
    if (!without_others) {
        var that = $(".test-session tr[data-id=" + id + "]"),
            is_opened = that.attr("data-opened"),
            id = id || that.attr("data-id");
        if (is_opened != "1") {
            $.get("aMDOTest.SessionResult?p_session_id=" + id, function(d) {
                that.attr("data-opened", 1).next("tr").show().find("td").html(d);
            });
        } else
            that.attr("data-opened", 0).next("tr").hide();
    } else {
        $.get("aMDOTest.SessionResult?p_session_id=" + id, function(d) {
            modal.show({
                backdrop: true,
                siz: "lg"
            }, event);
            modal.setTitle("Результаты теста");
            modal.setBody(d);
        });
    }
};

Exam.open_category = function(t, without_type) {
    var that = $(t),
        img = that.find("img");
    if (that.attr("data-opened") == 0) {
        img.attr("src", "/images/minus.gif");
        if (!without_type)
            that.next(".test-table").show();
        else
            Exam.show_qst(that);
        that.attr("data-opened", "1");
    } else {
        img.attr("src", "/images/plus.gif");
        if (!without_type)
            that.next(".test-table").hide();
        else
            Exam.show_qst(that);
        that.attr("data-opened", "0");
    }

};

Exam.show_qst = function(t, type) {
    var that = $(t),
        is_opened = that.attr("data-opened"),
        category_id = that.attr("data-id");
    if (is_opened == "0") {
        if (type) {
            $.get("aMDOTest.getQst?p_category=" + category_id + "&p_type_id=" + type, function(d) {
                that.attr("data-opened", "1").next("tr").show().find(".qst-container").html(d).show();
            });
        } else {
            $.get("aMDOTest.getQst?p_category=" + category_id, function(d) {
                that.next("form").find(".qst-container").html(d).show();
            });
        }
    } else {
        if (type)
            that.attr("data-opened", "0").next("tr").hide();
        else {
            that.next("form").find(".qst-container").hide();
            console.log(that);
        }
    }
};

Exam.post_answer = function(form, session_id) {
    var data = form.formSerialize(null, 'cp1251'),
        jqxhr = $.ajax({
            url: "aMDOTest.SaveAns",
            type: "POST",
            data: data
        });
    jqxhr.done(function(d) {
        var that = $(form),
            container = that.find(".qst-container");
        container.html(d);
        if (container.children().length == 0) {
            container.html($("<span/>", {
                class: "green",
                html: "Тест пройден"
            }));
            container.append($("<input/>", {
                type: "button",
                value: "Пройти еще раз",
                class: "Btn mt10 db no-load",
                onClick: "var that=$(this).parents('form').prev();Exam.open_category(that, 1);Exam.open_category(that, 1);"
            }));
            Exam.show_session_result(session_id, 1);
        }
    });
};

Exam.lang_change = function(t, lang, category_id, qst_id, i) {
    var that = $(t);
    $.get("aMDOTest.getQst?p_category=" + category_id + "&p_prev_qst_id=" + qst_id + "&p_i=" + i + "&p_lang=" + lang, function(d) {
        that.parents(".qst-container").html(d);
    });
};

Exam.delete_results = function() {
    $.get("aMDOTest.deleteResults", function() {
        snackbar.show("Результаты удалены");
        modal.hide();
    });
};

Exam.getQstList = function(that, ev) {
    if (url.checkEvent(ev))
        return;
    ev.preventDefault();
    ev.stopPropagation();
    var href = that.attr('href');
    var results = that.attr('data-count'),
        step = that.parent().parent().parent().attr("data-step");
    _data = href.substr(href.indexOf('?') + 1);
    var url_json = href.substring(href.indexOf('.'), href.indexOf('?')) == ".html" ? href.substr(0, href.indexOf('.') + 1) : href.substr(0, href
        .indexOf('?')) + "_";
    var jqxhr = $.ajax({
        url: url_json + 'json',
        data: _data,
        dataType: 'json'
    });
    jqxhr.done(function(data) {
        if (data == null) return;
        url.update(href);
        var _href = ListPage.clearHref(href, '');
        window.Table = window.Table || {};
        window.Table._data='';
        window.Table.table = that.parents('.Pagination');
        ListPage.handle_print(that, _href, results, step);
        Exam.qstListRender(data);
    });
};

Exam.qstListRender = function(data) {
    var qst = data.qst,
        length = qst.length,
        tbody = $("#test_qst_table tbody");
    tbody.empty();
    for (var i = 0; i < length; ++i) {
        tbody.append(Exam.qst_template(qst[i]));
    }
};

Exam.qst_template = function(qst) {
    var template = '';
    template += '<tr class="tac" data-id="' + qst.id + '">';
    template += '<td>' + qst.num + '<td><span onClick="Exam.load_qst_info(' + qst.id + ')" class="pointer">' + qst.text;
    template += '<td>' + qst.ans_count + '<td><a href="aMDOExamin.editComments?p_qst_id=' + qst.id + '" onClick="url.go(this, event);">' + qst.comments_count + '</a>';
    template += '<td><img src="/images/trash.gif" onClick="if(confirm(\'Удалить вопрос и все связанные записи?\')){ajax_get(\'aMDOExamin.deleteQst?p_qst_id=' + qst.id + '\')}" class="pointer" title="Удалить вопрос">';
    template += '</tr>';
    return template;
};

$(document).on("click", ".Pagination a", function(ev) {
    Exam.getQstList($(this), ev);
});

/*<====EXCEL====>*/

Exam.excel_window_open = function(id) {
    id = id || '';
    modal.show({
        backdrop: true,
        siz: "md"
    }, event);
    modal.setTitle("Загрузка ответов из Excel");
    $.get("aMDOTest.loadFromExcel?p_category_id=" + id, function(d) {
        var form = $("#xls_file_form")[0];
        modal.setBody(d);
        modal.setFooter({
            html: "<button class='Btn' type='button' onclick='Exam.xls_file_submit(form);'>Загрузить</button>",
            show: true
        });
    });
}

Exam.xls_file_submit = function(t) {
    var form = $("#xls_file_form"),
        fname;
    if (form.find("[name=p_file]").val() == "") {
        snackbar.show("Выберите файл");
        return;
    }
    Exam.ajax_submit_file_form(form[0]);
    if ($("#with_replace").length)
        fname = "Exam.xls_ans_upload";
    else
        fname = "Exam.xls_qst_upload";
    modal.chnSize("lg");
    modal.setFooter({
        html: "<button class='Btn' type='button' onclick='form[0].reset();'>Сброс</button>",
        append: "<button class='Btn' type='button' class='hide' onClick=\"" + fname + "($('#xls_render_form')[0])\">Далее</button>",
    });
}

Exam.ajax_submit_file_form = function(t) {
    var that = $(t),
        file_input = $("that input[name=p_file]"),
        fd = new FormData();
    fd.append("p_file", that.find("input[name=p_file]")[0].files[0]);
    that.find("input:not([type=file]), textarea, select:enabled").each(function() {
        var cur_input = $(this);
        if (cur_input.val())
            fd.append(cur_input.attr("name"), cur_input.val());
    });
    var jqxhr = $.ajax({
        url: that.attr("action"),
        type: that.attr("method") || "POST",
        data: fd,
        dataType: "html",
        processData: false,
        contentType: false
    });
    jqxhr.done(Exam.xls_render);
    jqxhr.fail(function() {
        ajaxFormError.call(that)
    });
    return false;
};

Exam.xls_render = function(data) {
    $("#xls_table_holder").html(data);
    $("#xls_file_wrapper").show();
};

Exam.xls_ans_upload = function(form) {
    var data = $(form).formSerialize(null, 'cp1251'),
        replace = $("#with_replace").is(":checked");
    var jqxhr = $.ajax({
        url: "aMDOTest.xls_ans_render",
        dataType: "json",
        type: "POST",
        data: data
    });
    jqxhr.done(function(d) {
        snackbar.show("Ответы загружены");
        var form = $("#test_edit_form"),
            ans = d.ans,
            len = ans.length,
            row;
        if (replace)
            form.find(".exam-ans").remove();
        for (var i = 0; i < len; i++) {
            Exam.add_test_ans();
            row = form.find(".exam-ans:last");
            row.find("input[name=p_ans_arr]").val(ans[i].text);
            if (ans[i].isTrue == 1)
                row.find("input[name=p_true_ans_num]").prop("checked", true);
        }
        modal.hide();
    });
};

Exam.xls_qst_upload = function(form) {
    var data = $(form).formSerialize(null, 'cp1251'),
        url = $(form).attr("action");
    var jqxhr = $.ajax({
        url: url,
        dataType: "json",
        type: "POST",
        data: data
    });
    jqxhr.done(function(d) {
        snackbar.show("Информация загружена");
        modal.hide();
    });
};

/*<====EXAMS====>*/

Exam.edit_comment = function(id) {
    modal.show({
        backdrop: true,
        siz: "md"
    }, event);
    modal.setTitle("Редактирование комментария");
    $.get("aMDOExamin.editComments_frm?p_comment_id=" + id, function(d) {
        modal.setBody(d);
        modal.setFooter({
            html: "<button class='Btn' type='button' onclick='return ajax_submit_form($(\"#test_comment_edit\")[0]);'>Сохранить</button>",
            append: "<button class='Btn' type='button' onclick='$(\"#test_comment_edit\")[0].reset();'>Сброс</button>",
            show: true
        });

    });
};

Exam.load_category_info = function(id) {
    $.getJSON('aMDOExamin.editCategory_json?p_category_id=' + id, function(d) {
        $("#excel_load_btn").show().find("span").attr("onClick", "Exam.excel_window_open(" + id + ")");
        var form = $("#new_category_form");
        form.find("input[name=p_category_id]").val(id);
        form.find("input[name=p_category_name]").val(d.name);
        form.find("input[name=p_show_in_tests]").prop("checked", d.show_in_tests);
        form.find("input[name=p_show_in_exams]").prop("checked", d.show_in_exams);
        $(".MiddleTitle").html('Редактирование категории "' + d.name + '"').attr("href", "aMDOExamin.editCategory?p_category_id=" + id);
    });
};

Exam.load_qst_info = function(id) {
    $.getJSON('aMDOExamin.getQstInfo_json?p_qst_id=' + id, function(d) {
        var form = $("#test_edit_form"),
            qst = d.qst,
            ans = d.ans;
        form.find(".exam-ans").remove();
        form.find("input[name=p_qst_id]").val(id);
        form.find("input[name=p_qst_num]").val(qst.num);
        form.find("textarea[name=p_qst_text]").val(qst.text);
        var length = ans.length;
        for (var i = 0; i < length; i++) {
            Exam.add_test_ans();
            form.find("label:last").html("Ответ №" + (i + 1) + ":").attr("data-num", (i + 1));
            form.find("input[name=p_ans_arr]:last").val(ans[i].text);
            form.find("input[name=p_true_ans_num]:last").prop("checked", ans[i].isTrue);
        }
    });
};

Exam.remove_test_ans = function(t) {
    var that = $(t),
        num = that.siblings("label").attr("data-num"),
        group = that.parents(".Form-group");
    group.nextAll().each(function() {
        var label = $(this).find("label"),
            num = label.attr("data-num") - 1;
        label.attr("data-num", num).html("Ответ №" + num);
    });
    group.remove();
};

Exam.add_test_ans = function() {
    if ($("#test_edit_form .Form-group:last").find("input:radio").length) {
        var ans_num = $("#test_edit_form label:last").attr("data-num"),
            new_ans_num = ++ans_num;
    } else new_ans_num = 1;
    $("<div/>", {
        class: "Form-group exam-ans",
        html: [
            $("<label/>", {
                class: "Form-label",
                "data-num": new_ans_num,
                html: "Ответ №" + (new_ans_num)
            }),
            $("<input/>", {
                name: "p_ans_id_arr",
                type: "hidden",
                value: "0",
            }),
            $("<input/>", {
                name: "p_ans_arr",
                value: "",
                class: "Form-control  width482p",
                placeholder: "Текст ответа"
            }),
            $("<span/>", {
                html: "&nbsp;"
            }),
            $("<input/>", {
                type: "radio",
                name: "p_true_ans_num",
                title: "Правильный ответ",
                value: new_ans_num
            }),
            $("<span/>", {
                html: "&nbsp;&nbsp;"
            }),
            $("<img>", {
                src: "http://redeyes.pp.ua/img/icons/icon-minus.png",
                onClick: "Exam.remove_test_ans($(this));",
                class: "pointer",
                title: "Удалить ответ"
            })
        ]
    }).appendTo("#test_edit_form");
};
