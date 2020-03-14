const express = require("express");
const body_parser = require("body-parser");
const {google} = require("googleapis");
const {initializeOAuth, randomInRange} = require("./utils");
const _ = require("lodash");


const oAuth2Client = initializeOAuth();
google.options({auth: oAuth2Client});

// APIs
const calendar = google.calendar("v3");

const app = express();

app.set("port", process.env.PORT || 5000);
app.use(body_parser.urlencoded({extended: true}));
app.use(body_parser.json());

app.get("/", (req, res) => {
    res.json({message: "Drip Bank backend is up and running."});
});

app.post("/loan", (req, res) => {
    const salary = req.body.salary;
    const carCost = req.body.car_cost;

    const accepted = salary > carCost;
    const message = accepted ? "Your loan application has been accepted!" : "Unfortunately, your application has been rejected.";

    res.json({accepted: accepted, message: message});
});

app.get("/credit", (req, res) => {
    const score = randomInRange(400, 1000);
    const message = score > 800 ? "Wow, you've got a really good credit score!" : score > 600 ? "Your credit score's looking pretty nice." : "Uh oh, looks like your credit score could use some improvement.";

    res.json({score: score, message: message});
});

app.post("/appointment", (req, res) => {
    const data = req.body;

    const start = new Date(_.sample(data.dates).date_time);
    const end = new Date(start.getTime() + 3600000)
    const new_event = {
        summary: "Drip Bank Advisor Meeting",
        description: "Finalize the loan process with an advisor in branch.",
        location: "845 Sherbrooke Street, Montreal, Quebec, Canada",
        start: {dateTime: start.toISOString(), timeZone: "America/Montreal"},
        end: {dateTime: end.toISOString(), timeZone: "America/Montreal"},
        attendees: [
            {displayName: data.user.name, email: data.user.email}
        ]
    };

    calendar.events.insert({
        calendarId: "primary",
        resource: new_event,
    }, (error, event) => {
        console.log(error);
        const created = !error;
        const link = event.data.htmlLink;
        const info = _.pick(event.data, "summary", "description", "location", "start", "end", "attendees");

        res.json({created, link, info});
    });
});

const server = app.listen(app.get("port"), () => {
    console.log("Listening on port ", server.address().port);
});
