const express = require('express');
const api = require('../helpers/api');
const bnAppsService = require('../models/bnApp.js').service;
const evalRoundsService = require('../models/evalRound').service;
const logsService = require('../models/log.js').service;
const testSubmissionService = require('../models/bnTest/testSubmission').service;
const getUserModsCount = require('../helpers/helpers').getUserModsCount;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res) => {
    const test = await testSubmissionService.query({
        applicant: req.session.mongoId,
        status: { $ne: 'finished' },
    });

    res.render('bnapp', {
        title: 'Beatmap Nominator Application',
        script: '../js/bnApp.js',
        isBnApp: true,
        loggedInAs: req.session.mongoId,
        isBnOrNat: res.locals.userRequest.isBnOrNat,
        isNat: res.locals.userRequest.isNat,
        pendingTest: test,
    });
});

/* POST a bn application */
router.post('/apply', async (req, res) => {
    if (!req.body.mods || !req.body.mode || !req.session.mongoId) {
        return res.json({ error: 'Missing mode or mods' });
    }

    //return res.json({ error: `You're not supposed to apply until this is officially announced, buddy ;)`})
    if(res.locals.userRequest.modes.indexOf(req.body.mode) >= 0){
        return res.json({ error: 'You\'re already a BN for this game mode!' });
    }
    
    let cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - 90);
    const [currentBnApp, currentBnEval] = await Promise.all([
        await bnAppsService.query({
            applicant: req.session.mongoId,
            mode: req.body.mode,
            createdAt: { $gte: cooldownDate },
        }),
        await evalRoundsService.query({
            bn: req.session.mongoId,
            mode: req.body.mode,
            updatedAt: { $gte: cooldownDate },
        }),
    ]);

    if (!currentBnApp && !currentBnEval) {
        // Check user kudosu total count & mod score
        const [userInfo, modScore] = await Promise.all([
            await api.getUserInfo(req.session.accessToken),
            await getUserModsCount(req.session.username, req.body.mode),
        ]);

        if (!userInfo || userInfo.error || !modScore || modScore.error) {
            return res.json({ error: 'Something went wrong! Please retry again.' });
        }

        if (modScore <= 0 || ((req.body.mode == 'osu' && userInfo.kudosu.total <= 200) || (req.body.mode != 'osu' && userInfo.kudosu.total <= 150))) {
            return res.json({ error: `You don't meet the minimum score or total kudosu requirement. 
                Your mod score needs to be higher or equal than 0. Currently it is ${modScore}` });
        }
        
        // Create app & test
        const [newBnApp, test] = await Promise.all([
            await testSubmissionService.create(req.session.mongoId, req.body.mode),
            await bnAppsService.create(req.session.mongoId, req.body.mode, req.body.mods),
        ]);
        if (!newBnApp || newBnApp.error || !test || test.error) {
            return res.json({ error: 'Failed to process application!' });
        } else {
            await bnAppsService.update(newBnApp.id, { test: test._id });
            res.json('pass');

            logsService.create(req.session.mongoId, `Applied for ${req.body.mode} BN`);
        }
    } else {
        if (currentBnApp){
            if (currentBnApp.error) {
                return res.json(currentBnApp.error);
            } else if (currentBnApp.active) {
                return res.json({ error: 'Your application is still being evaluated!' });
            }else {
                return res.json({
                    error: `Your previous application was rejected (check your osu! forum PMs for details). 
                        You may apply for this game mode again on 
                        ${new Date(currentBnApp.createdAt.setDate(currentBnApp.createdAt.getDate() + 90))
        .toString()
        .slice(4, 15)}.`,
                });
            }
        } else if (currentBnEval) {
            if (currentBnEval.error) {
                return res.json(currentBnEval.error);
            } else {
                return res.json({
                    error: `You were recently removed from the Beatmap Nominators in this game mode. 
                        You may apply for this game mode again on 
                        ${new Date(currentBnEval.updatedAt.setDate(currentBnEval.updatedAt.getDate() + 90))
        .toString()
        .slice(4, 15)}.`,
                });
            }
        }
    }
});

module.exports = router;
