const twilio = require('twilio');
const accountSid = 'AC924c9a60462ff8ef01fe7ab7cd72a0be';
const authToken = '4a4d15849fbbf4f07f1976345dbcc902';
const client = twilio(accountSid, authToken);

//     // client.messages
//     // .create({
//     //    body: 'Hello from Twilio!',
//     //    from: +923035783309,
//     //    to: +923338404905
//     //  })
//     // .then(message => console.log(message.sid));


//   module.exports={
//     client
//   }