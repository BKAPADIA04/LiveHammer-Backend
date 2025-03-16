const express = require('express');
const videoRouter = express.Router();
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const {getUserInMeet} = require("../../models.js");
const { body } = require('express-validator');

videoRouter.get('/',(req,res) =>
{
    res.send("Onto the Video Conferencing Page!");
});

videoRouter.get('/generateToken',(req,res) =>
{
    const appID = process.env.AGORA_API_ID;
    const appCertificate = process.env.AGORA_PRIMARY_CERTIFICATE;

    const channel = 'test';
    const uid = 0;
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600*24*365;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channel,
        uid,
        role,
        Math.floor(Date.now() / 1000) + expireTime
      );

    res.json({ 'appID' : appID, 'appCertificate' : appCertificate, 'uid' : uid, 'channel' : channel, 'Token' : token });

});

exports.videoRoute = videoRouter;