import { Calendar, formatDate } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import './index.css';

document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    // Get the current date as a string in the format 'YYYY-MM-DD'
    const currentDate = new Date().toISOString().slice(0, 10);

    var calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, iCalendarPlugin, momentTimezonePlugin],
        events: {
            url: 'basic.ics',
            format: 'ics'
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        dayMaxEventRows: 999,
        initialDate: currentDate,
        navLinks: true, // can click day/week names to navigate views
        editable: true,
        dayMaxEvents: false, // allow "more" link when too many events
        titleFormat: 'LLLL d, yyyy',
        timeZone: 'America/New_York',
        eventContent: function (info) {
            return {
                html: `<b class="fc-event-title">${info.event.title}</b>`
            };
        },
        eventDidMount: function (info) {
            // Attach a tooltip to the event element
            tippy(info.el, {
                content: info.event.extendedProps.description,
                interactive: true,
                trigger: 'click', // Show the tooltip on click
                onShow(instance) {
                    // Create a clickable popup when the tooltip is shown
                    const modalContainer = document.createElement('div');
                    modalContainer.classList.add('modal-container');
                    modalContainer.classList.add('fc-event-tooltip');
                    
                    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    console.log(userTimeZone);

                    let str = formatDate(info.event.start, {
                        month: 'long',
                        year: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        timeZoneName: 'short',
                        timeZone: userTimeZone,
                        locale: 'en-US'
                    })

                    console.log(`str`, str)
                    
                    const startTime = info.event.start
                    const endTime = info.event.end

                    const modalContent = document.createElement('div');
                    modalContent.classList.add('modal-content');
                    modalContent.innerHTML = `<b>${info.event.title}</b><br></br><strong>Start:</strong> ${startTime}<br><strong>End:</strong> ${endTime}<br><br>${info.event.extendedProps.description}<br>`;

                    // Add a "Download ICS" button to the popup
                    const downloadButton = document.createElement('button');
                    downloadButton.innerHTML = 'Download ICS';
                    downloadButton.classList.add('modal-download');
                    downloadButton.addEventListener('click', () => {
                        // Generate and trigger the ICS file download
                        const icsData = generateICSData(info.event);
                        downloadICS(info.event.title, icsData);
                    });
                    modalContent.appendChild(downloadButton);

                    // Add a close button to the popup
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = 'Close';
                    closeButton.classList.add('modal-close');
                    closeButton.addEventListener('click', () => instance.hide());
                    modalContent.appendChild(closeButton);

                    modalContainer.appendChild(modalContent);
                    instance.setContent(modalContainer);
                },
            });
        }
    });

    calendar.render();
});

// Function to generate ICS data from the event
function generateICSData(event) {
    const startDate = event.start.toISOString().replace(/-/g, '').replace(/:/g, '').slice(0, -5);
    const endDate = event.end.toISOString().replace(/-/g, '').replace(/:/g, '').slice(0, -5);
    const cleanDescription = event.extendedProps.description.replace(/<\/?[^>]+(>|$)/g, "");

    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:${startDate}Z
DTSTART:${startDate}Z
DTEND:${endDate}Z
SUMMARY:${event.title}
DESCRIPTION:${cleanDescription}
END:VEVENT
END:VCALENDAR`;
}

// Function to trigger the download of the ICS file
function downloadICS(fileName, data) {
    const blob = new Blob([data], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.ics`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}