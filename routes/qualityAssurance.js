const express = require('express');
const api = require('../helpers/api');
const aiessService = require('../models/aiess').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isBnOrNat);
router.use(api.isLeader);

/* GET bn app page */
router.get('/', (req, res) => {
    res.render('qualityassurance', {
        title: 'Quality Assurance',
        script: '../javascripts/qualityAssurance.js',
        isQualityAssurance: true,
        isBn: res.locals.userRequest.isBn,
        isNat: res.locals.userRequest.isNat || res.locals.userRequest.isSpectator,     
    });
});

const defaultPopulate = [
    { populate: 'qualityAssuranceCheckers', display: 'username osuId' },
];

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res) => {
    let date = new Date();
    date.setDate(date.getDate() - 7);
    let data = await aiessService.query(
        { eventType: 'Qualified', timestamp: { $gte: date } },
        defaultPopulate,
        { timestamp: -1 },
        true
    );
    res.json({ maps: data, userId: res.locals.userRequest.id, mode: res.locals.userRequest.modes[0] || 'osu' });
});

/* POST assign user */
router.post('/assignUser/:id', api.isBnOrNat, async (req, res) => {
    let e = await aiessService.update(req.params.id, { $push: { qualityAssuranceCheckers: req.session.mongoId } });
    e = await aiessService.query({ _id: req.params.id }, defaultPopulate);
    res.json(e);
    logsService.create(
        req.session.mongoId,
        `Added ${req.session.username} as QA checker for s/${e.beatmapsetId}`
    );
});

/* POST unassign user */
router.post('/unassignUser/:id', api.isBnOrNat, async (req, res) => {
    let e = await aiessService.update(req.params.id, { $pull: { qualityAssuranceCheckers: req.session.mongoId } });
    e = await aiessService.query({ _id: req.params.id }, defaultPopulate);
    res.json(e);
    logsService.create(
        req.session.mongoId,
        `Removed ${req.session.username} from QA checker for s/${e.beatmapsetId}`
    );
});

module.exports = router;