Sys.Messages = library(function() {
    var _data,
        _getMessages = function(that, ev, type) {
            if (url.checkEvent(ev))
                return;
            ev.preventDefault();
            ev.stopPropagation();
            var href = that.attr('href');
            if (type == 'list') {
                var results = that.attr('data-count'),
                    step = that.parent().parent().parent().attr("data-step");
            } else if (type == 'log')
                var id = that.attr('data-id');
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
                if (type == 'list') {
                    var _href = ListPage.clearHref(href, '');
                    ListPage.handle_print(that, _href, results, step);
                }
                _render(data, type);
            });
        },
        _render = function(data, type) {
            var qst = data.qst,
                ans = data.ans,
                $tbody;
            if (type == 'log') {
                var old_url = document.location.href;
                if (old_url.indexOf('p_msg_log_id') == -1) {
                    old_url += ((old_url.indexOf('?') == -1) ? '?' : '&') + 'p_msg_log_id=' + qst.msgId;
                } else {
                    old_url = old_url.substr(0, old_url.indexOf('p_msg_log_id')) + 'p_msg_log_id=' + qst.msgId;
                }
                var new_url = old_url.substr(old_url.indexOf('?'))
                url.update(url.getPathname() + new_url);
                $tbody = $("#msgLogTable tbody");
            } else if (type == 'LogOnLoad') {
                $tbody = $("#msgLogTable tbody");
            } else if (type == 'list') {
                url.update(url.getPathname() + '?' + _data);
                $tbody = $("#msgListTable tbody");
                $("#msgLogDiv").hide();
            }
            $tbody.empty();
            if (type == 'log' || type == 'LogOnLoad') {
                $tbody.append(_templateMsgHeader(qst));
                $tbody.append(_templateMsgBody(qst));
                if (ans) {
                    var $ansBlockTitle = $("<tr/>", {
                        class: "TableTitle black",
                        html: $("<th/>", {
                            class: "TableCell",
                            colspan: 5,
                            html: "Ответы и дополнения"
                        })
                    });
                    $tbody.append($ansBlockTitle);
                    var ansNum = ans.length;
                    for (var i = 0; i < ansNum; i++)
                        $tbody.append(_templateMsgHeader(ans[i])).append(_templateMsgBody(ans[i]));
                }
                if (qst.isDeleted) {
                    $("#sendMsgDiv").hide();
                    $("#deletedByFio").html(qst.fio).show();
                } else {
                    $("#deleteMsgDiv").hide();
                    if (!qst.userCantMsg) {
                        $("#sendMsgDiv input[name='p_msg_id']").val(qst.msgId);
                        $("#sendMsgDiv").show();
                    }
                }
                $("#msgLogTitleFio").html(qst.fio);
                $("#msgLogDiv .MiddleTitle").attr("href", "aMDOMessages.readMsg?p_msg_id=" + qst.msgId);
                $("#msgLogDiv").data("id", qst.msgId).show();
                window.location.hash = "msgLogDiv";
            } else if (type == 'list') {
                var msgNum = qst.length;
                for (var i = 0; i < msgNum; i++)
                    $tbody.append(_templateMsgHeader(qst[i]));
            }
        },
        _templateMsgHeader = function(msg) {
            var result = '';
            result += '<tr id="message-id--' + msg.msgId + '" class="tac' + ((msg.isSender || msg.tableType != "log") ? '"' : ' bgcw" data-id="') + msg.msgId + '"' + '>';
            if (msg.tableType == "list")
                result += '<td class="TableCell">' + msg.i;
            result += '<td class="TableCell"' + ((msg.tableType == "log") ? ' rowspan="2" style="vertical-align:middle;">' : '>') + '<img src="/images/mail_' + ((msg.readDate) ? 'c' : 'o') + '.gif"';
            if (msg.readDate)
                result += ' title="Прочитано получателем ' + msg.readDate + '">';
            else
                result += ' title="Не прочитано получателем">';
            if (msg.tableType == "log")
                result += '<td class="TableCell"><span title="Переслать сообщение" class="pointer" data-id="' + msg.id + '" onClick="Sys.Messages.msgForward(event, ' + msg.msgId + ')">' + '<img src="/images/msg_fwd.gif" /></span>';
            result += '<td class="TableCell"' + ((!msg.isQst) ? ' colspan=2>' : '>') + msg.addDate;
            if (msg.isQst) {
                result += '<td class="TableCell tal">' + ((msg.tableType == "list") ? '<a href="aMDOMessages.readMsg?p_msg_id=' + msg.msgId + '" title="Открыть сообщение" class="message-log blue" data-id="' + msg.msgId + '">' + msg.title + '</a>' : msg.title);
                if (msg.type == 1 || msg.type == 2)
                    result += '<br><a title="Перейти к сообщению форума" href="aMDOSForum.getAns?p_id=' + msg.sfrmParId + '#p' + msg.sfrmId + '">[за ответ от ' + msg.sfrmParDate + ' на вопрос "' + msg.sfrmTitle + '" от ' + msg.sfrmDate + ']</a>);';
            }
            result += '<td class="blue pointer TableCell"><a class="purple" href="aMDOMessages.ReadOldMsgList?p_user_id=' + msg.userId + '">' + ((msg.isQst) ? '[c]' : '') + '</a>';
            result += '<a href="aMDOSForum.userCard?p_id=' + msg.userId + '">';
            result += '<img src="/images/' + ((msg.isSender) ? 'outbox' : 'inbox') + '.gif" title="' + ((msg.isSender) ? 'Отправленное' : 'Принятое') + '" hspace=3 align=absmiddle>' + msg.fio + '</a>';
            result += msg.userInfo;
            if (msg.tableType == "list") {
                result += '<td class="TableCell">' + msg.ansCount;
                result += '<td class="TableCell">' + ((msg.ansCount) ? msg.lastAnsDate : '');
                result += '<td class="TableCell">' + msg.notReadAnsCount;
                result += '<td class="TableCell tac pointer"';
                result += ' onClick="if(confirm(\'Удалить это сообщение?\')){ajax_get(\'aMDOMessages.MsgDel?p_msg_id=' + msg.msgId + '\');}">';
                result += '<img src="/images/trash.gif" align=absmiddle title="Удалить сообщение">';
                result += '<td  class="TableCell"><input type="checkbox" name="p_msg_id" value="' + msg.msgId + '" class="SearchParam-Content-Input Form-control ">';
            }
            result += '</tr>';
            return result;
        },
        _templateMsgBody = function(msg) {
            var result = '';
            result += '<tr' + ((msg.isSender) ? '>' : ' class="bgcw">');
            result += '<td class="TableCell" colspan=5>';
            if (msg.type == 1) {
                result += msg.sfrmParDate + ' на <a class="blue" href="aMDOSForum.getAns?p_id=' + msg.sfrmParId + '#p' + msg.sfrmId + '">вопрос от ' + msg.sfrmDate + ' "' + msg.sfrmTitle + '"</a>.';
                result += '<br><br>Вам добавлено ' + msg.msgCost + ' бонусных очков.';
            } else if (msg.type == 2) {
                result += 'Модераторы форума ' + ((msg.msgCost >= 0) ? 'Вам добавили ' : 'с Вас сняли ') + msg.msgCost + ' бонусных очков';
                result += ' за ' + ((msg.text) ? msg.text : 'ответ от ' + msg.sfrmParDate + ' на <a class=blue href="aMDOSForum.getAns?p_id=' + msg.sfrmParId + '#p' + msg.sfrmId + '">вопрос от ' + msg.sfrmDate + ' "' + msg.sfrmTitle + '"</a>.');
            } else result += msg.text;
            result += '</tr>';
            return result;
        };
    return {
        forwardMessagesSend: function(msgID) {
            var form = $("#friends_forward_form");
            if (form.find("input[type=checkbox]:checked").length == 0) {
                alert("Укажите хотя бы одного друга");
                return;
            }
            form.find("#ForwardMessID").val(msgID);
            ajax_submit_form(form[0]);
        },
        getMsg: function(that, ev, type) {
            return _getMessages(that, ev, type);
        },
        getLogOnLoad: function(id) {
            var jqxhr = $.ajax({
                url: 'aMDOMessages.ReadMsg_json',
                data: 'p_msg_id=' + id,
                dataType: 'json'
            });
            jqxhr.done(function(data) {
                if (data) _render(data, 'LogOnLoad');
            });
        },
        msgForward: function(ev, msgID) {
            modal.show({
                backdrop: true,
                siz: "sm"
            }, ev);
            modal.setTitle("Переслать кому...");
            $.get("aMDOMessages.ForwardMessages", function(d) {
                modal.setBody(d);
                modal.setFooter({
                    html: "<button class='Btn' type='button' onClick='Sys.Messages.forwardMessagesSend(" + msgID + ")'>Переслать</button>",
                    show: true
                });
            });
        }
    }
}());

$(document).on("click", "#msgListTable td .message-log", function(ev) {
    Sys.Messages.getMsg($(this), ev, 'log');
});

$(document).on("click", ".Pagination a", function(ev) {
    Sys.Messages.getMsg($(this), ev, 'list');
});
