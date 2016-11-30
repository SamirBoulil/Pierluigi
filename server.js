'use strict'

const express = require('express');
const Slapp = require('slapp');
const Utils = require('./Utils');
const ConvoStore = require('slapp-convo-beepboop');
const Context = require('slapp-context-beepboop');
const ApiHelper = require('./ApiHelper');

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})

// enable debugging
require('beepboop-slapp-presence-polyfill')(slapp, {
	debug: true
})


//*********************************************
// Register handler
//*********************************************
slapp.message('^.register', ['direct_message'], (msg) => {
	ApiHelper.isPlayerRegistered(msg.meta.user_id)
	.then((isRegistered) => {
		if (!isRegistered) {
			msg.say({
				text: '',
				attachments: [{
					fallback: 'Do you want to register ?',
					title: 'Do you want to join the Akeneo Baby Foot Star League (ABSL) ?',
					callback_id: 'register_callback',
					color: '#3AA3E3',
					attachment_type: 'default',
					actions: [{
						name: 'register_answer',
						text: 'Hell yeah!',
						style: 'primary',
						type: 'button',
						value: 'yes'
					},
					{
						name: 'register_answer',
						text: 'Nope, not intrested',
						type: 'button',
						value: 'no'
					}]
				}]
			})
		} else {
			msg.say('You are already enrolled into the Akeneo Baby Foot Star League');
        // TODO: show rankings
        // TODO: Show challengers
      }
    }
    ).catch(function(error) {
    // TODO: Send message if an error occured
  });
  })

// Two != callbacks for this
slapp.action('register_callback', 'register_answer', (msg, value) => {
	var registerAnswer = '';

	if (value === 'yes') {
		registerAnswer = 'Awesome! let me register your account before you can start playing.';
		ApiHelper.registerPlayer(msg.meta.user_id);
	} else {
		registerAnswer= 'Alright, then come back to me when you are ready! :soccer:';
    // TODO: Call the helper route
  }

  var responseAnswer = {
	text: '',
	attachments: [{
		fallback: 'Do you want to register ?',
		title: 'Do you want to join the Akeneo Baby Foot Star League (ABSL) ?',
		text: registerAnswer,
		callback_id: 'register_callback',
		color: '#3AA3E3',
	}]
  };

  msg.respond(msg.body.response_url, responseAnswer);
  // TODO: show ranks
  // TODO: show possible challengers');
});

//*********************************************
// Feature match logging: .win
//*********************************************
// TODO: Protected route
slapp.message('^.win <@([^>]+)> ([^>]+)\s*-\s*([^>]+)$', ['direct_message'], (msg, text, loserId, winnerScore, loserScore) => {
	console.log(text);

	var winnerId = msg.meta.user_id;
	winnerScore = Math.floor(parseInt(winnerScore, 10));
	loserScore = Math.floor(parseInt(loserScore, 10));

	var isInputError = false;
	var textResponse = [];

  // Parsing score values
  if (isNaN(winnerScore) || isNaN(loserScore)) {
    // TODO: Print usage();
    textResponse.push('The scores are not valid values.');
  } else {
	if (loserScore >= winnerScore) {
		isInputError = true;
		textResponse.push(`- Winner\'s score *(${winnerScore})* cannot be greater than the loser\'s score *(${loserScore})*.`);
	}
	if (winnerScore !== 10) {
		isInputError = true;
		textResponse.push(`- Winner\'s score *(${winnerScore})* should be 10.`);
	}
  }

  // Checking player's registration
  if (winnerId === loserId) {
	isInputError = true;
	textResponse.push('- Winner and loser cannot be the same user.');
  }

  ApiHelper.isPlayerRegistered(loserId)
  .then((isRegistered) => {
	if (isRegistered === false) {
		isInputError = true;
		textResponse.push(`- Losing player (<@${loserId}>) is not registered in the Akeneo Baby Foot League.`);
      // TODO: Show the list of user with the rankings
    }

    if (isInputError) {
	msg.say('Oups, an error occured while saving the game result.\n' + textResponse.join('\n'));
    } else {
	var state = {winnerId: winnerId, loserId: loserId, winnerScore, loserScore};
	debugger;
	msg
	.say(`Congratz for this huge win ! Let me check the result with <@${loserId}>.\n I\'ll come back to you when I\m done.`)
	.route('handle_match_confirmation', state, 600);
    }
  })
  .catch((error) => {
	console.log('An error occured while checking if the loserId is registered');
	console.log(error);
  });
});

slapp.route('handle_match_confirmation', (msg, state) => {
	console.log('Route handling confirmation');

	msg.say({
		channel: state.loserId,
		text: '',
		attachments: [{
			fallback: 'Match log confirmation',
			title: `Do you confirm that you lost ${state.winnerScore}-${state.loserScore} against <@${state.winnerId}> ?`,
			callback_id: 'match_confirmation_callback',
			color: '#3AA3E3',
			attachment_type: 'default',
			actions: [{
				name: 'match_confirmation_yes',
				text: 'Yep, good game.',
				style: 'primary',
				type: 'button',
				value: Utils.marshall({ state: state, value: 'yes' })
			},
			{
				name: 'match_confirmation_no',
				text: 'NO WAY ! That\' a lie!',
				type: 'button',
				value: Utils.marshall({ state: state, value: 'no' })
			}]
		}]
	});
});

slapp.action('match_confirmation_callback', 'match_confirmation_yes', (msg, args) => {
	args = Utils.unmarshall(args);

	if (typeof(args.state) !== 'undefined') {
		var state = args.state;
    ApiHelper.addMatchResult(state.winnerId, state.loserId, state.winnerScore, state.loserScore)
    .then(() => {
      msg.respond(msg.body.response_url, 'Ok, the match result has been successfully registered.');
      ApiHelper.refreshRank(state.winnerId, state.loserId);
      msg.route('show_rank_and_challengers', {playerId: state.loserId});
      msg.route('show_rank_and_challengeers', {playerId: state.winnerId});
    });
	}
});

slapp.action('match_confirmation_callback', 'match_confirmation_no', (msg, args) => {
	args = Utils.unmarshall(args);
	if (typeof(args.state) !== 'undefined') {
		var state = args.state;
		ApiHelper.addMatchResult(state.winnerId, state.loserId, state.winnerScore, state.loserScore)
		.then(()=> {
			msg.respond(msg.body.response_url, `Ok, You\'ll have to see this IRL with <@${state.winnerId}>`);
			msg.route('show_rank_and_challengers', {playerId: state.loserId});
			msg.route('show_rank_and_challengers', {playerId: state.winnerId});
		});
	}
});

slapp.route('show_rank_and_challengers', (msg, state) => {
  // TODO: show ranks and challengers
});

//*********************************************
// Help handler .wcid
//*********************************************
slapp.message('help|.wcid', ['mention', 'direct_message'], (msg) => {
	var HELP_TEXT = `
	I will respond to the following messages:
	\`.wcid\` - to get some help.
	\`.register\` - to see this message.
	\`.won <LOSING-PLAYER> <WINNER-SCORE>-<LOSER-SCORE>\` - to log a game result you have won.
	\`hi\` - to demonstrate a conversation that tracks state.
	\`thanks\` - to demonstrate a simple response.
	\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
	\`attachment\` - to see a Slack attachment message.
	`
	msg.say(HELP_TEXT)
})

// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
/*
 *slapp
 *.message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
 *  msg
 *    .say(`${text}, how are you?`)
 *    // sends next event from user to this route, passing along state
 *    .route('how-are-you', { greeting: text })
 *})
 *.route('how-are-you', (msg, state) => {
 *  var text = (msg.body.event && msg.body.event.text) || ''
 *
 *    // user may not have typed text as their next action, ask again and re-route
 *    if (!text) {
 *      return msg
 *        .say("Whoops, I'm still waiting to hear how you're doing.")
 *        .say('How are you?')
 *        .route('how-are-you', state)
 *    }
 *
 *  // add their response to state
 *  state.status = text
 *
 *    msg
 *    .say(`Ok then. What's your favorite color?`)
 *    .route('color', state)
 *})
 *.route('color', (msg, state) => {
 *  var text = (msg.body.event && msg.body.event.text) || ''
 *
 *    // user may not have typed text as their next action, ask again and re-route
 *    if (!text) {
 *      return msg
 *        .say("I'm eagerly awaiting to hear your favorite color.")
 *        .route('color', state)
 *    }
 *
 *  // add their response to state
 *  state.color = text
 *
 *    msg
 *    .say('Thanks for sharing.')
 *    .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
 *    // At this point, since we don't route anywhere, the "conversation" is over
 *})
 */

// Can use a regex as well
/*
 *slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
 *  // You can provide a list of responses, and a random one will be chosen
 *  // You can also include slack emoji in your responses
 *  msg.say([
 *      "You're welcome :smile:",
 *      'You bet',
 *      ':+1: Of course',
 *      'Anytime :sun_with_face: :full_moon_with_face:'
 *  ])
 *})
 */

// demonstrate returning an attachment...
/*
 *slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
 *  msg.say({
 *    text: 'Check out this amazing attachment! :confetti_ball: ',
 *    attachments: [{
 *      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
 *      title: 'Slapp Library - Open Source',
 *      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
 *      title_link: 'https://beepboophq.com/',
 *      color: '#7CD197'
 *    }]
 *  })
 *})
 */

// Catch-all for any other responses not handled above
/*
 *slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
 *  // respond only 40% of the time
 *  if (Math.random() < 0.4) {
 *    msg.say([':wave:', ':pray:', ':raised_hands:'])
 *  }
 *})
 */

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
	if (err) {
		return console.error(err)
	}

	console.log(`Listening on port ${port}`)
})
