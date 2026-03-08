$(function () {

    "use strict";

    let timer;
    let sessionLen = $('#session-len').html();
    let breakLen = $('#break-len').html();
    let sessionShowing = true;
    let finishCnt = 0;
    let playing = false;
    const savedSound = localStorage.getItem('pomodoroSound');
    let volumeOn = savedSound !== null ? savedSound === 'true' : true;
    const savedColor = localStorage.getItem('pomodoroColor');
    let color = savedColor || '#EF5350';
    let dailyCntCircle = '';
    const tomatoSvg = '<svg class="tomato-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 64 64"><path d="M32 8c-2 0-3.5.5-4 1.5C24 7 20 6 18 7c-1.5.8-1 2.5 0 3.5C10 14 4 22 4 34c0 14 12 26 28 26s28-12 28-26c0-12-6-20-14-23.5 1-1 1.5-2.7 0-3.5-2-1-6 0-10 2.5-.5-1-2-1.5-4-1.5z" fill="#fff"/><path d="M28 9.5c-.5-3-1-6.5 1-8.5 2.5-2.5 5-.5 4 2s-3 5-5 6.5z" fill="#fff" opacity="0.7"/></svg>';

    // Restore saved settings
    if (savedColor) {
        $('body').css('background-color', color);
        $('.color img').hide();
        $('.color[data-color="' + color + '"]').children().show();
    }
    $('#sound-toggle').prop('checked', volumeOn);

    let circle = document.querySelector('#circle');
    let ctx = circle.getContext('2d');
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;

    // --- Stats helpers ---
    function getTodayKey() {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getStats() {
        try {
            return JSON.parse(localStorage.getItem('pomodoroStats')) || {};
        } catch (e) {
            return {};
        }
    }

    function saveStats(stats) {
        localStorage.setItem('pomodoroStats', JSON.stringify(stats));
    }

    function recordSession(type, minutes) {
        const key = getTodayKey();
        const stats = getStats();
        if (!stats[key]) stats[key] = { focus: 0, focusMin: 0, break: 0, breakMin: 0 };
        if (typeof stats[key] === 'number') {
            stats[key] = { focus: stats[key], focusMin: 0, break: 0, breakMin: 0 };
        }
        if (type === 'focus') {
            stats[key].focus++;
            stats[key].focusMin += minutes;
        } else {
            stats[key].break++;
            stats[key].breakMin += minutes;
        }
        saveStats(stats);
    }

    function formatTime(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h + '시간 ' + String(m).padStart(2, '0') + '분 00초';
    }

    function renderStats() {
        const stats = getStats();
        const today = getTodayKey();
        let todayData = stats[today] || { focus: 0, focusMin: 0, break: 0, breakMin: 0 };
        if (typeof todayData === 'number') {
            todayData = { focus: todayData, focusMin: 0, break: 0, breakMin: 0 };
        }

        $('#today-focus-line').html('<b>' + formatTime(todayData.focusMin) + '</b>동안 총 <b>' + todayData.focus + '회</b> <b>집중</b>했어요! 🔥');
        $('#today-break-line').html('<b>' + formatTime(todayData.breakMin) + '</b>동안 총 <b>' + todayData.break + '회</b> 쉬었어요! ☕');

        // Weekly stats
        const days = [];
        let weeklyFocusTotal = 0;
        let weeklyBreakTotal = 0;
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            let dayData = stats[key] || { focus: 0, break: 0 };
            if (typeof dayData === 'number') dayData = { focus: dayData, break: 0 };
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            weeklyFocusTotal += (dayData.focus || 0);
            weeklyBreakTotal += (dayData.break || 0);
            days.push({
                date: (d.getMonth() + 1) + '/' + d.getDate() + ' (' + dayNames[d.getDay()] + ')',
                focus: dayData.focus || 0,
                breakCnt: dayData.break || 0
            });
        }

        let html = '';
        for (let j = 0; j < days.length; j++) {
            html += '<div class="weekly-stats-row' + (j === days.length - 1 ? ' today' : '') + '">';
            html += '<span class="weekly-stats-date">' + days[j].date + '</span>';
            html += '<div class="weekly-stats-vals">';
            html += '<span>집중</span><span><b>' + days[j].focus + '회</b></span>';
            html += '<span>휴식</span><span><b>' + days[j].breakCnt + '회</b></span>';
            html += '</div>';
            html += '</div>';
        }
        $('#weekly-stats').html(html);

        // Draw line chart
        const chart = document.querySelector('#weekly-chart');
        chart.width = chart.parentElement.clientWidth;
        chart.height = 150;
        const cctx = chart.getContext('2d');
        const padL = 30, padR = 10, padT = 20, padB = 30;
        const w = chart.width - padL - padR;
        const h = chart.height - padT - padB;
        let maxVal = 1;
        for (let k = 0; k < days.length; k++) {
            if (days[k].focus > maxVal) maxVal = days[k].focus;
        }

        cctx.clearRect(0, 0, chart.width, chart.height);

        // Grid lines
        cctx.strokeStyle = 'rgba(255,255,255,0.15)';
        cctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
            const gy = padT + h - (h * g / 4);
            cctx.beginPath();
            cctx.moveTo(padL, gy);
            cctx.lineTo(padL + w, gy);
            cctx.stroke();
        }

        // Y-axis labels
        cctx.fillStyle = 'rgba(255,255,255,0.5)';
        cctx.font = '10px sans-serif';
        cctx.textAlign = 'right';
        for (let g2 = 0; g2 <= 4; g2++) {
            const gy2 = padT + h - (h * g2 / 4);
            cctx.fillText(Math.round(maxVal * g2 / 4), padL - 6, gy2 + 3);
        }

        // X-axis labels
        cctx.textAlign = 'center';
        for (let x = 0; x < days.length; x++) {
            const xPos = padL + (w / (days.length - 1)) * x;
            const shortDate = days[x].date.split(' ')[0];
            cctx.fillText(shortDate, xPos, chart.height - 6);
        }

        // Line
        cctx.strokeStyle = 'rgba(255,255,255,0.8)';
        cctx.lineWidth = 2;
        cctx.lineJoin = 'round';
        cctx.beginPath();
        for (let p = 0; p < days.length; p++) {
            const px = padL + (w / (days.length - 1)) * p;
            const py = padT + h - (h * days[p].focus / maxVal);
            if (p === 0) cctx.moveTo(px, py);
            else cctx.lineTo(px, py);
        }
        cctx.stroke();

        // Dots
        for (let d2 = 0; d2 < days.length; d2++) {
            const dx = padL + (w / (days.length - 1)) * d2;
            const dy = padT + h - (h * days[d2].focus / maxVal);
            cctx.beginPath();
            cctx.arc(dx, dy, 4, 0, 2 * Math.PI);
            cctx.fillStyle = '#fff';
            cctx.fill();
        }

        let totalHtml = '<span class="weekly-stats-date">합계</span>';
        totalHtml += '<div class="weekly-stats-vals">';
        totalHtml += '<span>집중</span><span><b>' + weeklyFocusTotal + '회</b></span>';
        totalHtml += '<span>휴식</span><span><b>' + weeklyBreakTotal + '회</b></span>';
        totalHtml += '</div>';
        $('#weekly-total-row').html(totalHtml);
    }

    // --- Tab navigation ---
    $('.nav-item').click(function () {
        const page = $(this).data('page');
        $('.nav-item').removeClass('active');
        $(this).addClass('active');
        $('.page').removeClass('active');
        $('#page-' + page).addClass('active');

        // Update titlebar text
        if (page === 'timer') {
            $('#titlebar-text').html(sessionShowing ? tomatoSvg + ' POMODORO' : '<i class="fa-solid fa-mug-hot"></i> BREAK');
            $('#titlebar-left').show();
        } else if (page === 'stats') {
            $('#titlebar-text').html('<i class="fa-solid fa-chart-simple"></i> 통계');
            $('#titlebar-left').hide();
            renderStats();
        } else if (page === 'settings') {
            $('#titlebar-text').html('<i class="fa-solid fa-gear"></i> 설정');
            $('#titlebar-left').hide();
        }
    });

    // --- Sound toggle ---
    $('#sound-toggle').change(function () {
        volumeOn = $(this).is(':checked');
        localStorage.setItem('pomodoroSound', volumeOn);
    });

    // --- Timer logic ---
    function runTimer() {
        let minutes = $('#minutes').html();
        let seconds = parseInt($('#seconds').html());

        if (seconds > 0) {
            seconds--;
            drawArc(minutes * 60 + seconds);
            if (seconds < 10) seconds = "0" + seconds.toString();
            $('#seconds').html(seconds);
        } else if (minutes > 0) {
            $('#minutes').html(--minutes);
            $('#seconds').html(59);
            drawArc(minutes * 60 + 59);
        } else {
            timeUp();
        }
    }

    function drawArc(timeRemain) {
        ctx.clearRect(0, 0, circle.width, circle.height);
        let totalTime = sessionShowing ? sessionLen : breakLen;
        let percentRem = (totalTime * 60 - timeRemain) / (totalTime * 60);
        ctx.beginPath();
        ctx.arc(132, 132, 130, 1.5 * Math.PI, 1.5 * Math.PI + percentRem * (2 * Math.PI));
        ctx.stroke();
    }

    function timeUp() {
        $('#timer-container')
            .addClass('animated flash')
            .one(
                'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                function () {
                    $("#timer-container").removeClass('animated flash');
                }
            );

        ctx.clearRect(0, 0, circle.width, circle.height);
        if (volumeOn) $('#ding')[0].play();

        if (sessionShowing) {
            recordSession('focus', Number(sessionLen));
            finishCnt++;
            $("#daily-cnt-circle").html(finishCnt + '회 성공!');

            $('#titlebar-text').html('<i class="fa-solid fa-mug-hot"></i> BREAK');
            sessionShowing = false;
            $('#minutes').html(breakLen);
            $('body').css('background-color', '#808080');
        } else {
            recordSession('break', Number(breakLen));

            $("#daily-cnt-circle").html(finishCnt + '회 성공!');

            $('#titlebar-text').html(tomatoSvg + ' POMODORO');
            sessionShowing = true;
            $('#minutes').html(sessionLen);
            $('body').css('background-color', color);
        }
    }

    $('.play-pause-wrap').click(function () {
        if (!playing) {
            timer = setInterval(runTimer, 1000);
        } else {
            clearInterval(timer);
        }
        $('.play-pause-wrap').toggleClass('hidden');
        playing = playing ? false : true;
    });

    function updateLengthDescription() {
        $('#length-description').html(sessionLen + '분 집중, ' + breakLen + '분 휴식이 반복돼요 :)');
    }
    updateLengthDescription();

    function setLength(id, minuteVal) {
        $(id).html(minuteVal);
        if ((id === '#session-len' && sessionShowing) ||
            (id === '#break-len' && !sessionShowing)) {
            $('#minutes').html(minuteVal);
            $('#seconds').html('00');
            ctx.clearRect(0, 0, circle.width, circle.height);
        }
    }

    $('#break-incr').click(function () {
        if (breakLen < 999) { setLength('#break-len', ++breakLen); updateLengthDescription(); }
    });
    $('#break-decr').click(function () {
        if (breakLen > 1) { setLength('#break-len', --breakLen); updateLengthDescription(); }
    });
    $('#session-incr').click(function () {
        if (sessionLen < 999) { setLength('#session-len', ++sessionLen); updateLengthDescription(); }
    });
    $('#session-decr').click(function () {
        if (sessionLen > 1) { setLength('#session-len', --sessionLen); updateLengthDescription(); }
    });

    $('#reset').click(function () {
        ctx.clearRect(0, 0, circle.width, circle.height);
        $('#minutes').html(sessionLen);
        $('#seconds').html('00');
        $("#daily-cnt-circle").html('');

        if (!sessionShowing) {
            $('#titlebar-text').html(tomatoSvg + ' POMODORO');
            sessionShowing = true;
            finishCnt = 0;
            dailyCntCircle = '';
        }

        if (playing) {
            clearInterval(timer);
            $('.play-pause-wrap').toggleClass('hidden');
            playing = false;
        }

        $('body').css('background-color', color);
    });

    // color change
    $('.color').click(function () {
        $('.color img').hide();
        $(this).children().show();
        color = $(this).data('color');
        $('body').css('background-color', color);
        localStorage.setItem('pomodoroColor', color);
    });

    // Initialize stats on load
    renderStats();
});
