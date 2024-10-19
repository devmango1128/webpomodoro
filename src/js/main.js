$(function () {

    "use strict";

    let timer;
    let sessionLen = $('#session-len').html();
    let breakLen = $('#break-len').html();
    let longBreakLen = $('#long-break-len').html();
    let longCntBreakLen = $('#long-cnt-break-len').html();
    let dailyLen = $('#daily-len').html();
    let sessionShowing = true;
    let untilLongBreakCnt = 1;
    let finishCnt = 0;
    let playing = false;
    let volumeOn = true;
    let color = '#EF5350';
    let dailyCntCircle = '';
    const sendEmailBtn = document.querySelector('#sendEmail');

    sendEmailBtn.addEventListener('click', function() {
        const email = 'devmango1128@gmail.com';
        const subject = '[pomodoro 사이트 문의]';
        window.location = `mailto:${email}?subject=${subject}`;
    });

    let circle = document.querySelector('#circle');
    let ctx = circle.getContext('2d');

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 4;

    function runTimer() {
        // decrease time displayed in circle by 1 second and draw corresponding arc
        let minutes = $('#minutes').html();
        let seconds = parseInt($('#seconds').html());

        // decrease seconds value by 1, zero-padding if single digit
        if (seconds > 0) {
            seconds--;
            drawArc(minutes * 60 + seconds);
            if (seconds < 10) seconds = "0" + seconds.toString();
            $('#seconds').html(seconds);
        }
        // decrease minute value once seconds reaches 0 and set seconds to 59
        else if (minutes > 0) {
            $('#minutes').html(--minutes);
            $('#seconds').html(59);
            drawArc(minutes * 60 + 59);
        } else {
            timeUp();
        }
    }

    function drawArc(timeRemain) {
        // draw the correct proportion of the timer circle
        ctx.clearRect(0, 0, circle.width, circle.height);
        let totalTime = sessionShowing ? sessionLen : breakLen;
        let percentRem = (totalTime * 60 - timeRemain) / (totalTime * 60);
        ctx.beginPath();
        ctx.arc(
            132,
            132,
            130,
            1.5 * Math.PI,
            1.5 * Math.PI + percentRem * (2 * Math.PI)
        );
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

        //break
        if (sessionShowing) {

            // //long-break인지 체크
            // if(untilLongBreakCnt === Number($('#long-cnt-break-len').html())) {
            //
            //     finishCnt++;
            //
            //     //daily 끝인지 확인
            //     if(finishCnt === Number($('#daily-len').html())) {
            //
            //         $('#timer-label').html('DAILY GOAL!');
            //         $("#endDing")[0].play();
            //         $("#timer-label").html("POMODORO");
            //         $('body').css('background-color', color);
            //         $('#reset').trigger('click');
            //
            //         return;
            //     }
            //
            //     $('#timer-label').html('LONG BREAK');
            //     sessionShowing = false;
            //     $('#minutes').html(longBreakLen);
            //     $('body').css('background-color', '#696969');
            //     //초기화
            //     untilLongBreakCnt = 0;
            //
            // } else {

                $('#timer-label').html('BREAK');
                sessionShowing = false;
                $('#minutes').html(breakLen);
                $('body').css('background-color', '#808080');

            // }

        //pomodoro
        } else {

            dailyCntCircle = '';

            for(let i = 0; i < finishCnt; i++) {
                dailyCntCircle += '●';
            }

            $("#daily-cnt-circle").html(dailyCntCircle);

            untilLongBreakCnt++;

            $('#timer-label').html('POMODORO');
            sessionShowing = true;
            $('#minutes').html(sessionLen);
            $('body').css('background-color', color);
        }
    }

    $('.play-pause').click(function () {

        if (!playing) {
            timer = setInterval(runTimer, 1000);
        } else {
            clearInterval(timer);
        }
        $('.play-pause').toggleClass('hidden');
        playing = playing ? false : true;
    });

    function setLength(id, minuteVal) {

        $(id).html(minuteVal);
        if ((id === '#session-len' && sessionShowing) ||
            (id === '#break-len' && !sessionShowing)
        ) {
            $('#minutes').html(minuteVal);
            $('#seconds').html('00');
            ctx.clearRect(0, 0, circle.width, circle.height);
        }
    }

    $('#break-incr').click(function () {
        if (breakLen < 999) {
            setLength('#break-len', ++breakLen);
        }
    });
    $('#break-decr').click(function () {
        if (breakLen > 1) {
            setLength('#break-len', --breakLen);
        }
    });

    $('#session-incr').click(function () {
        if (sessionLen < 999) {
            setLength('#session-len', ++sessionLen);
        }
    });
    $('#session-decr').click(function () {
        if (sessionLen > 1) {
            setLength('#session-len', --sessionLen);
        }
    });

    $('#long-break-incr').click(function () {
        if (longBreakLen < 999) {
            setLength('#long-break-len', ++longBreakLen);
        }
    });
    $('#long-break-decr').click(function () {
        if (longBreakLen > 1) {
            setLength('#long-break-len', --longBreakLen);
        }
    });

    $('#long-cnt-break-incr').click(function () {
        if (longCntBreakLen < 10) {
            setLength('#long-cnt-break-len', ++longCntBreakLen);
            $('#reset').trigger('click');
        }
    });
    $('#long-cnt-break-decr').click(function () {
        if (longCntBreakLen > 1) {
            setLength('#long-cnt-break-len', --longCntBreakLen);
            $('#reset').trigger('click');
        }
    });

    $('#daily-incr').click(function () {
        if (dailyLen < 10) {
            setLength('#daily-len', ++dailyLen);
            $('#reset').trigger('click');
        }
    });
    $('#daily-decr').click(function () {
        if (dailyLen > 1) {
            setLength('#daily-len', --dailyLen);
            $('#reset').trigger('click');
        }
    });

    $('#reset').click(function () {

        ctx.clearRect(0, 0, circle.width, circle.height);

        $('#minutes').html(sessionLen);
        $('#seconds').html('00');
        $("#daily-cnt-circle").html('');

        if (!sessionShowing) {
            $('#timer-label').html('POMODORO');
            sessionShowing = true;
            untilLongBreakCnt = 1;
            finishCnt = 0;
            dailyCntCircle = '';
        }

        if (playing) {
            clearInterval(timer);
            $('.play-pause').toggleClass('hidden');
            playing = false;
        }

        $('body').css('background-color', color);
    });

    // toggle audio
    $('#audio').click(function() {
        volumeOn = volumeOn ? false : true;
        volumeOn ? $('#audio').attr('src','/images/audio_on.png') : $('#audio').attr('src','/images/audio_off.png')
    });

    // color change
    $('.color').click(function() {
        $('.color img').hide();
        $(this).children().show();
        color = $(this).data('color');
        $('body').css('background-color', color);
    })
});
