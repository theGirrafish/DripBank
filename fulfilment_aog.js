"use strict";

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const {dialogflow, BasicCard, Button, Confirmation, Image, NewSurface, SignIn, SimpleResponse, Table} = require("actions-on-google");
const axios = require("axios");
const moment = require("moment");
const _ = require("lodash");

console.log(`Running Node ${process.version}`);

admin.initializeApp();
axios.defaults.timeout = 10000;
axios.defaults.headers.common["Content-Type"] = "application/json";
process.env.DEBUG = "dialogflow:debug";

const app = dialogflow({
  debug: true,
  clientId: "206518389551-gdd1vb69rf9ci9e862qp04fjs20hlkio.apps.googleusercontent.com"
});

// global vars
var usr_glob = {};

// global basic info vars
var data_basic_info_glob = {};
var usr_first_name_glob = "";
var usr_last_name_glob = "";
var usr_dob_glob = "";
var usr_phone_glob = "";
var usr_address_glob = "";

// global car specs vars
var data_car_specs_glob = {};
var usr_car_make_glob = "";
var usr_car_cost_glob = {};
var usr_down_payment_glob = {};

// global book appointment vars
var usr_date_time_glob = [];
var usr_event_glob = {};

// global household expense vars
var data_household_expenses_glob = {};
var usr_household_cost_glob = {};
var usr_utilities_cost_glob = {};

// constants
const TIME_OPTIONS = {hour: "numeric", minute: "numeric"};
const DATE_OPTIONS = {weekday: "long", day: "numeric", month: "long", year: "numeric"};
const CAPABILITIES = "actions.capability.SCREEN_OUTPUT";
const HEROKU_URL = "https://arthur-fulfilment.herokuapp.com";
const FIREBASE_URL = "https://arthur-43da2.firebaseio.com/";
const DRIP_WIDE_URL = "https://firebasestorage.googleapis.com/v0/b/arthur-43da2.appspot.com/o/drip_wide.jpg?alt=media&token=e4f12f6d-25e0-4200-a50f-e220e932a9ad";
const DRIP_LARGE_URL = "https://firebasestorage.googleapis.com/v0/b/arthur-43da2.appspot.com/o/drip_large.jpg?alt=media&token=737d2b91-f836-4608-a3ad-3734d53806a7";

function formatDOB(date) {
  const day_strings = {
    "1": ["first", "one", "1st"], "2": ["second", "two", "2nd"], "3": ["third", "three", "3rd"], "4": ["fourth", "four", "4th"], "5": ["fifth", "five", "5th"], "6": ["sixth", "six", "6th"], "7": ["seventh", "seven", "7th"], "8": ["eighth", "eight", "8th"], "9": ["ninth", "nine", "9th"],
    "10": ["tenth", "ten", "10th"], "11": ["eleventh", "eleven", "11th"], "12": ["twelfth", "twelve", "12th"], "13": ["thirteenth", "thirteen", "13th"], "14": ["fourteenth", "fourteen", "14th"], "15": ["fifteenth", "fifteen", "15th"], "16": ["sixteenth", "sixteen", "16th"], "17": ["seventeenth", "seventeen", "17th"], "18": ["eighteenth", "eighteen", "18th"], "19": ["nineteenth", "nineteen", "19th"],
    "20": ["twentieth", "twenty", "20th"], "21": ["twenty-first", "twenty-one", "21st"], "22": ["twenty-second", "twenty-two", "22nd"], "23": ["twenty-third", "twenty-three", "23rd"], "24": ["twenty-fourth", "twenty-four", "24th"], "25": ["twenty-fifth", "twenty-five", "25th"], "26": ["twenty-sixth", "twenty-six", "26th"], "27": ["twenty-seventh", "twenty-seven", "27th"], "28": ["twenty-eighth", "twenty-eight", "28th"], "29": ["twenty-ninth", "twenty-nine", "29th"],
    "30": ["thirtieth" ,"thirty", "30th"], "31": ["thirty-first", "thirty-one", "31st"]
  };

  for (let day in day_strings) {
    day_strings[day].forEach(synonym => date = date.replace(synonym, day));
  }

  return date;
}

function isValidDOB(date) {
  return !isNaN(Date.parse(date));
}

function formatPhoneNumber(phone) {
  const separators = [" ", "-", "(", ")"];
  separators.forEach(sep => phone = phone.replace(sep, ""));

  return phone;
}

function isValidPhoneNumber(phone) {
  const phone_valid_regex = /^(\+[0-9]|[0-9])?[(]?[0-9]{3}[)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4}$/;
  return phone_valid_regex.test(phone);
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { let info, value; try { info = gen[key](arg); value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { let self = this, args = arguments; return new Promise(function (resolve, reject) { let gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }


// ====================================================================================================
// ====================================================================================================


function save_to_db(data, location) {
  const options = {
    method: "put",
    url: `${FIREBASE_URL}user/${usr_glob.sub || "unknown"}/${location}`,
    data: data
  };

  axios(options).then(response => {
    console.log(response.data);
  }).catch(error => {
    console.log(error);
  });
}

function get_from_db() {
  const options = {
    method: "get",
    url: `${FIREBASE_URL}user/${usr_glob.sub || "unknown"}.json`
  };

  return axios(options);
}

function get_loan_approval() {
  const options = {
    method: "post",
    url: `${HEROKU_URL}/loan`,
    data: {
      salary: Math.floor(Math.random() * (100000-10000+1) + 10000),
      car_cost: Math.floor(Math.random() * (50000-10000+1) + 10000)
    }
  };

  return axios(options);
}

function get_credit_score() {
  const options = {
    method: "get",
    url: `${HEROKU_URL}/credit`
  };

  return axios(options);
}

function get_appointment(data) {
  const options = {
    method: "post",
    url: `${HEROKU_URL}/appointment`,
    data: data
  };

  return axios(options);
}

function clear_globals() {
  usr_glob = {};
  clear_basic_info_globals();
  clear_car_specs_globals();
  clear_book_appointment_globals();
  clear_household_expenses_globals();
}

function clear_basic_info_globals() {
  data_basic_info_glob = {};
  usr_first_name_glob = "";
  usr_last_name_glob = "";
  usr_dob_glob = "";
  usr_phone_glob = "";
  usr_address_glob = "";
}

function clear_car_specs_globals() {
  data_car_specs_glob = {};
  usr_car_make_glob = "";
  usr_car_cost_glob = {};
  usr_down_payment_glob = {};
}

function clear_household_expenses_globals() {
  data_household_expenses_glob = {};
  usr_household_cost_glob = {};
  usr_utilities_cost_glob = {};
}


function clear_book_appointment_globals() {
  usr_date_time_glob = [];
  usr_event_glob = {};
}

// ====================================================================================================
// ====================================================================================================


function fallback(conv) {
  conv.ask(_.sample([
    "I didn't understand.",
    "I'm sorry, can you try again?",
    "Could you repeat that one last time?"
  ]));
}

function welcome(conv) {
  clear_globals();
  if (conv.user.profile.payload) {
    usr_glob = conv.user.profile.payload;
    usr_glob.token = conv.user.profile.token;
    usr_first_name_glob = usr_glob.given_name;
    usr_last_name_glob = usr_glob.family_name;
    conv.ask(`Welcome back to Drip Bank, ${usr_glob.given_name}!`);
    conv.contexts.set("Bookappointment", 99);
  } else {
    conv.ask(new SignIn("Welcome to Drip Bank! I see it's your first time here. To use the full feature set of our app"));
  }
}

function start_loan(conv) {
  return get_from_db().then(response => {
    if (response.data.client && response.data.client.existing) {
      conv.ask("Of course! Go ahead and tell me a bit about yourself.");
      conv.contexts.set("Basicinfo", 1);
    } else {
      conv.ask(_.sample([
        "Sure, we can start now. First of all, do you have an account with Drip Bank?",
        "Of course, let's start now. Just to make sure, do you have an account with Drip Bank?"
      ]));
      conv.contexts.set("Startloanprocess-followup", 1);
    }
  });
}

function existing_account(conv) {
  let data = {existing: true};
  console.log("Sending client account status to DB.");
  save_to_db(data, "client.json");
  conv.ask(_.sample([
    "Great! Tell me about yourself.",
    "Okay, that's perfect. Tell me about yourself."
  ]));}

function no_account(conv) {
  let data = {existing: false};
  console.log("Sending client account status to DB.");
  save_to_db(data, "client.json");
  conv.ask(_.sample([
    "It's okay, you can reach out to your local branch and make one. Would you like to schedule an appointment?",
    "That's not an issue. You would need to make an appointment with your local branch before starting a loan process."
  ]));
}

function sign_in(conv, params, signin) {
  if (signin.status === "OK") {
    usr_glob = conv.user.profile.payload;
    usr_glob.token = conv.user.profile.token;
    usr_first_name_glob = usr_glob.given_name;
    usr_last_name_glob = usr_glob.family_name;
    conv.ask(`So what do you want to do next, ${usr_glob.given_name}?`);
    conv.contexts.set("Bookappointment", 99);
  } else {
    conv.ask("No worries, you still have access to basic features for now. So what do you want to do next?");
  }
}

// uses slot filling
function save_basic_info(conv, params) {
  let answered = false;

  // required data
  let usr_first_name = params.firstname;
  let usr_last_name = params.lastname;
  let usr_dob = formatDOB(params.date_of_birth);
  let usr_phone = formatPhoneNumber(params.phonenumber);
  let usr_address = params.address;

  // extra data
  let usr_age = params.age.amount;
  let usr_city = params.geocity;

  let is_usr_first_name = usr_first_name.length > 0;
  let is_usr_last_name = usr_last_name.length > 0;
  let is_usr_dob = usr_dob.length > 0;
  let is_usr_phone = usr_phone.length > 0;
  let is_usr_address = usr_address.length > 0;
  let is_usr_city = usr_city.length > 0;

  if (!is_usr_first_name && !is_usr_last_name) {  // both names missing
    if (usr_first_name_glob.length > 0 && usr_last_name_glob.length > 0) {
      usr_first_name = usr_first_name_glob;
      usr_last_name = usr_last_name_glob;
      is_usr_first_name = is_usr_last_name = true;
    } else if (!answered) {
      conv.ask("What is your complete name?");
      answered = true;
    }
  } else if (!is_usr_first_name && is_usr_last_name) {  // first name missing
    data_basic_info_glob.last_name = usr_last_name_glob = usr_last_name;
    is_usr_last_name = true;
    if (usr_first_name_glob.length > 0) {
      usr_first_name = usr_first_name_glob;
      is_usr_first_name = true;
    } else if (!answered) {
      conv.ask("Perfect. What is your first name?");
      answered = true;
    }
  } else if (is_usr_first_name && !is_usr_last_name) {  // last name missing
    data_basic_info_glob.first_name = usr_first_name_glob = usr_first_name;
    is_usr_first_name = true;
    if (usr_last_name_glob.length > 0) {
      usr_last_name = usr_last_name_glob;
      is_usr_last_name = true;
    } else if (!answered) {
      conv.ask(`Sounds good ${usr_first_name}. Can I also get your last name?`);
      answered = true;
    }
  } else {
    data_basic_info_glob.first_name = usr_first_name_glob = usr_first_name;
    data_basic_info_glob.last_name = usr_last_name_glob = usr_last_name;
  }

  if (!is_usr_dob) {
    if (usr_dob_glob.length > 0) {
      usr_dob = usr_dob_glob;
      is_usr_dob = true;
    } else if (!answered) {
      conv.ask("Great. Can you tell me your complete date of birth.");
      answered = true;
    }
  } else {
    if (isValidDOB(usr_dob)) {
      let dob = moment(new Date(usr_dob));
      usr_age = moment().diff(dob, "years");
      usr_dob = dob.format("MM/DD/YYYY");
      data_basic_info_glob.age = usr_age;
      data_basic_info_glob.dob = usr_dob_glob = usr_dob;
    } else if (!answered) {
      conv.ask("I didn't catch your complete date of birth. Could you say it one more time?");
      is_usr_dob = false;
      answered = true;
    }
  }

  if (!is_usr_phone) {
    if (usr_phone_glob.length > 0) {
      usr_phone = usr_phone_glob;
      is_usr_phone = true;
    } else if (!answered) {
      conv.ask("Alright, can I also get your phone number?");
      answered = true;
    }
  } else  {
    if (isValidPhoneNumber(usr_phone)) {
      data_basic_info_glob.phone_number = usr_phone_glob = usr_phone;
    } else if (!answered) {
      conv.ask(`<speak>Your phone number sounds invalid. I heard <prosody rate="slow"><say-as interpret-as="verbatim">${usr_phone}</say-as>.</prosody> Could you repeat one more time, please?</speak>`);
      is_usr_phone = false;
      answered = true;
    }
  }

  if (!is_usr_address) {
    if (usr_address_glob.length > 0) {
      usr_address = usr_address_glob;
      is_usr_address = true;
    } else if (!answered) {
      conv.ask("Thank you. I also need your address.");
      answered = true;
    }
  } else {
    data_basic_info_glob.address = usr_address_glob = usr_address;
  }

  if (!is_usr_city) {
    data_basic_info_glob.city = usr_city;
    is_usr_city = true;
  }

  if (!answered && is_usr_first_name && is_usr_last_name && is_usr_dob && is_usr_phone && is_usr_address) {
    console.log("Sending basic info data to DB.");
    save_to_db(data_basic_info_glob, "basic_info.json");
    conv.ask(`Perfect ${usr_first_name}! Now I was wondering, what car would you like?`);
    conv.contexts.delete("Basicinfo");
  }
}

function save_car_specs(conv, params) {
  let answered = false;

  let usr_car_make = params.car_make;
  let usr_car_cost = params.car_cost;
  let usr_down_payment = params.down_payment;

  let is_usr_car_make = usr_car_make.length > 0;
  let is_usr_car_cost = !!usr_car_cost.amount;
  let is_usr_down_payment = !!usr_down_payment.amount;
  console.log(params);
  if (usr_car_cost.currency === "USD") usr_car_cost.currency = "CAD";
  if (usr_down_payment.currency === "USD") usr_down_payment.currency = "CAD";

  if (!is_usr_car_make) {
    if (usr_car_make_glob.length > 0) {
      usr_car_make = usr_car_make_glob;
      is_usr_car_make = true;
    } else if (!answered) {
      conv.ask("What make is this car of yours?");
      answered = true;
    }
  } else {
    data_car_specs_glob.car_make = usr_car_make_glob = usr_car_make;
  }

  if (!is_usr_car_cost) {
    if (usr_car_cost_glob.amount) {
      usr_car_cost = usr_car_cost_glob;
      is_usr_car_cost = true;
    } else if (!answered) {
      conv.ask(_.sample([
        `How much does your ${usr_car_make} cost?`,
        `What is the cost of this ${usr_car_make} you're looking at?`
      ]));
      answered = true;
    }
  } else {
    data_car_specs_glob.car_cost = usr_car_cost_glob = usr_car_cost;
  }

  if (!is_usr_down_payment) {
    if (usr_down_payment_glob.amount) {
      usr_down_payment = usr_down_payment_glob;
      is_usr_down_payment = true;
    } else if (!answered) {
      conv.ask("I also need to know the down payment you are ready to put.");
      answered = true;
    }
  } else {
    data_car_specs_glob.down_payment = usr_down_payment_glob = usr_down_payment;
  }

  if (!answered && is_usr_car_make && is_usr_car_cost && is_usr_down_payment) {
    console.log("Sending car specs data to DB.");
    save_to_db(data_car_specs_glob, "car_specs.json");
    conv.ask("Thanks! How much is your monthly rent?");
    conv.contexts.delete("Carspecifications");
  }
}

function save_household_expenses(conv, params) {
  let answered = false;

  let usr_household_cost = params.household_cost;
  let usr_utilities_cost = params.utilities_cost;

  let is_usr_household_cost = !!usr_household_cost.amount;
  let is_usr_utilities_cost = !!usr_utilities_cost.amount;
  console.log(params);
  if (usr_household_cost.currency === "USD") usr_household_cost.currency = "CAD";
  if (usr_utilities_cost.currency === "USD") usr_utilities_cost.currency = "CAD";

  if (!is_usr_household_cost) {
    if (usr_household_cost_glob.amount) {
      usr_household_cost = usr_household_cost_glob;
      is_usr_household_cost = true;
    } else if (!answered) {
      conv.ask("Can you tell me how much you pay per month for your rent?");
      answered = true;
    }
  } else {
    data_household_expenses_glob.household_cost = usr_household_cost_glob = usr_household_cost;
  }

  if (!is_usr_utilities_cost) {
    if (usr_utilities_cost_glob.amount) {
      usr_utilities_cost = usr_utilities_cost_glob;
      is_usr_utilities_cost = true;
    } else if (!answered) {
      conv.ask("How much do your utilities cost per month?");
      answered = true;
    }
  } else {
    data_household_expenses_glob.utilities_cost = usr_utilities_cost_glob = usr_utilities_cost;
  }

  if (!answered && is_usr_household_cost && is_usr_utilities_cost) {
    console.log("Sending household expenses data to DB.");
    save_to_db(data_household_expenses_glob, "household_expenses.json");
    conv.ask("Great! Now I need to know about your employment. What is your main profession?");
    conv.contexts.delete("Householdexpenses");
  }
}

function save_employment(conv, params) {
  const usr_profession = params.profession;
  const usr_salary = params.salary;

  if (usr_salary.currency === "USD") usr_salary.currency = "CAD";

  let data = {};
  data.profession = usr_profession;
  data.salary = usr_salary;

  console.log("Sending employment data to DB.");
  save_to_db(data, "employment.json");
  conv.ask("Awesome! We're almost done. Do you own any assets, like stocks or savings?");
}

function save_assets(conv, params) {
  const usr_stocks = params.stocks;
  const usr_savings = params.savings;

  if (usr_stocks.currency === "USD") usr_stocks.currency = "CAD";
  if (usr_savings.currency === "USD") usr_savings.currency = "CAD";

  let data = {};
  data.stocks = usr_stocks;
  data.savings = usr_savings;

  console.log("Sending assets data to DB.");
  save_to_db(data, "assets.json");
  conv.ask(_.sample([
    "Alright, perfect! There's one last step before sending in your loan application. Is it alright with you if we run an online credit check on you?",
    "Thanks for sharing all your info! The last thing we need is your credit score. We would have to run an online check, is that okay with you?"
  ]));
}

function credit_check_yes(_x) {
  return _credit_check_yes.apply(this, arguments);
}

function _credit_check_yes() {
  let __credit_check_yes = _asyncToGenerator(function* (conv) {
    let {score, message} = yield get_credit_score().then(response => {
      return response.data;
    }).catch(error => {
      console.log(error);
    });

    let data = {};
    data.credit_score = score;

    // TODO: Handle case where user isn't on screen supported device
    console.log("Sending credit score data to DB.");
    save_to_db(data, "credit_score.json");
    conv.ask(_.sample([
      `${message} Do you want me to send you a summary of all the information or would you rather see your approval status?`,
      "Alright everything looks good. It might take a while to process your info, would you like to see a summary or wait for the final decision?",
      "Alright the data has been collected! We've put together all your info, now let's see what we can do. Do you want a summary first or straight to your approval?"
    ]));
  });
  return __credit_check_yes.apply(this, arguments);
}

function credit_check_no(conv) {
  if (usr_glob.token) {
    conv.ask(new Confirmation(`That's alright, ${usr_glob.given_name}. We won't be able to finish today, but if you'd like we can continue this in branch. Would you like me to book an appointment with your advisor?`));
  } else {
    conv.close("Well that's a shame. All that work for nothing. Better luck next time.");
  }
}

function cards_summary(_x) {
  return _cards_summary.apply(this, arguments);
}

function _cards_summary() {
  let __cards_summary = _asyncToGenerator(function* (conv) {
    let data = yield get_from_db().then(response => {
      return response.data;
    }).catch(error => {
      console.log(error);
    });

    // TODO: Handle case where user isn't on screen supported device
    conv.ask(new SimpleResponse({
      speech: _.sample([
        "Here's a quick summary of everything we just went through together.",
        "This is a small summary holding the key points of our conversation."
      ]),
      text: "Here's the summary of the loan process we just went through."
    }));

    conv.ask(new Table({
      title: "Loan Summary",
      image: new Image({
        url: DRIP_LARGE_URL,
        alt: "Drip Bank"
      }),
      dividers: true,
      columns: ["Credit Score", "Income", "Down Payment"],
      rows: _.unzip([
        [data.credit_score.credit_score],
        [`${data.car_specs.car_cost.amount} ${data.car_specs.car_cost.currency}$`],
        [`${data.car_specs.down_payment.amount} ${data.car_specs.down_payment.currency}$`]
      ])
    }));
  });
  return __cards_summary.apply(this, arguments);
}

function final_decision(_x) {
  return _final_decision.apply(this, arguments);
}

function _final_decision() {
  let __final_decision = _asyncToGenerator(function* (conv) {
    let message = yield get_loan_approval().then(response => {
      return response.data.accepted ? `I've got good news! ${response.data.message}` : `So we took a look at your profile. ${response.data.message}`;
    }).catch(error => {
      console.log(error);
    });

    conv.ask(_.sample([
      message,
      `Alright that's a wrap! ${message}`,
      `Alright that's it! It was a long journey but we finally made it. ${message}`
    ]));
  });
  return __final_decision.apply(this, arguments);
}

function desire_appointment(conv, params, confirmation) {
  if (confirmation) {
    conv.ask(_.sample([
      "Alright perfect. Can you give me one or two dates and at what time you'd be available?",
      "Just what I like to hear. So what day and time would work for you?"
    ]));
  } else {
    conv.close("Well that's a shame. All that work for nothing. Better luck next time.");
  }
}

function book_appointment(_x, _y) {
  return _book_appointment.apply(this, arguments);
}

function _book_appointment() {
  let __book_appointment = _asyncToGenerator(function* (conv, params) {
    let usr_date_time = params.date_time.filter(date => date.date_time);

    if (usr_date_time.length === 0) {
      if (usr_date_time_glob.length > 0) {
        usr_date_time = usr_date_time_glob;
      } else {
        conv.ask("Can you give me a date and time where you'd be available?");
        return;
      }
    } else {
      usr_date_time_glob = usr_date_time;
    }

    let data = {};
    data.user = usr_glob;
    data.dates = usr_date_time;

    console.log(`Booking appointment for ${usr_glob.given_name} and Drip Bank.`);
    let appointment = yield get_appointment(data).then(response => {
      return response.data;
    }).catch(error => {
      console.log(error);
    });

    if (appointment.created) {
      usr_event_glob = appointment;
    } else {
      conv.ask("Sorry about that, I think a screw got loose while trying to book your appointment. Could you tell me the date and time again?");
      return;
    }

    const start = new Date(appointment.info.start.dateTime);
    const time_options = [usr_glob.locale, Object.assign({}, TIME_OPTIONS, {timeZone: appointment.info.start.timeZone})];
    const date_options = [usr_glob.locale, Object.assign({}, DATE_OPTIONS, {timeZone: appointment.info.start.timeZone})];
    if (conv.available.surfaces.capabilities.has(CAPABILITIES)) {
      conv.ask(new NewSurface({
        context: `Perfect, you're all set! I created your appointment for ${start.toLocaleTimeString(...time_options)} on ${start.toLocaleDateString(...date_options)}.`,
        notification: `New Event - ${appointment.info.summary}`,
        capabilities: [CAPABILITIES]
      }));
    } else {
      conv.close("No phone, no card. Tough luck, life sucks.");
    }
  });
  return __book_appointment.apply(this, arguments);
}

function cards_appointment(conv, params, new_surface) {
  if (new_surface.status === "OK") {
    conv.ask("We're looking forward to meeting you in branch!");
    conv.close(new BasicCard({
      title: usr_event_glob.info.summary,
      subtitle: new Date(usr_event_glob.info.start.dateTime).toLocaleString(usr_glob.locale, Object.assign({}, DATE_OPTIONS, TIME_OPTIONS, {timeZone: usr_event_glob.info.start.timeZone})),
      text: usr_event_glob.info.description,
      buttons: new Button({
        title: "Open Calendar 📅",
        url: usr_event_glob.link
      }),
      image: new Image({
        alt: "Drip Bank Logo",
        url: DRIP_LARGE_URL
      })
    }));
  } else {
    conv.close("No phone, no card. Tough luck, life sucks.");
  }
}

function catch_error(conv, error) {
  console.error(error);
  conv.ask("Sorry bout that, I'm still a little rusty. Could you repeat?");
}

// Run the proper function handler based on the matched Dialogflow intent name
app.intent("Default Fallback Intent", fallback);
app.intent("Default Welcome Intent", welcome);
app.intent("Start loan process", start_loan);
app.intent("Start loan process - Existing account", existing_account);
app.intent("Start loan process - No account", no_account);
app.intent("Sign in", sign_in);
app.intent("Basic info", save_basic_info);
app.intent("Car specifications", save_car_specs);
app.intent("Household expenses", save_household_expenses);
app.intent("Employment", save_employment);
app.intent("Assets", save_assets);
app.intent("Credit check - yes", credit_check_yes);
app.intent("Credit check - no", credit_check_no);
app.intent("Cards summary", cards_summary);
app.intent("Final decision", final_decision);
app.intent("Desire appointment", desire_appointment);
app.intent("Book appointment", book_appointment);
app.intent("Cards appointment", cards_appointment);
app.catch(catch_error);

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
