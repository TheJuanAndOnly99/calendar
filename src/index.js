import { Calendar } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import tippy from 'tippy.js'; 
import 'tippy.js/dist/tippy.css'; 
import './index.css';

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    // Get the current date as a string in the format 'YYYY-MM-DD'
    const currentDate = new Date().toISOString().slice(0, 10);

    var calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, iCalendarPlugin],
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

                    const modalContent = document.createElement('div');
                    modalContent.classList.add('modal-content');
                    modalContent.innerHTML = `<b>${info.event.title}</b><br></br><strong>Start:</strong> ${info.event.start.toLocaleString()} EST<br><strong>End:</strong> ${info.event.end.toLocaleString()} EST<br><br>${info.event.extendedProps.description}<br>`;
                    modalContainer.appendChild(modalContent);

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

                    instance.setContent(modalContainer);
                },
            });
        }
    });

    calendar.render();
});

// Function to generate ICS data from the event
function generateICSData(event) {
    const eventTitle = event.title;
    const startDate = event.start.toISOString().replace(/-|:/g, '').slice(0, -5);
    const endDate = event.end.toISOString().replace(/-|:/g, '').slice(0, -5);

    const rrule = event._def.recurringDef;

    let icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:${startDate}Z
DTSTART:${startDate}Z
DTEND:${endDate}Z
SUMMARY:${eventTitle}
DESCRIPTION:${event.extendedProps.description}
`;

    // If it's a recurring event, add RRULE information
    if (rrule) {
        const freq = rrule.freq;
        const interval = rrule.interval || 1;
        const until = rrule.until ? rrule.until.toISOString().replace(/-|:/g, '').slice(0, -5) : '';
        
        icsData += `RRULE:FREQ=${freq};INTERVAL=${interval}`;
        
        if (until) {
            icsData += `;UNTIL=${until}`;
        }
        
        icsData += '\n';
    }

    icsData += 'END:VEVENT\nEND:VCALENDAR';

    return icsData;
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