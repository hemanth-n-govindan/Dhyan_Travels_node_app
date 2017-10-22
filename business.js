var Promise = require('promise');
var fs = require('fs');
var tempConfig = null;
var notifyRequest = null;
function readApplicationContentFileCallback(req, res, config) {
    try {
        tempConfig = config;
        ReadApplicationContentFile(config).then(function (data) {
            res.status(200).json(data);
        }, function (error) {
            console.log(new Date().toLocaleString());
            console.error('Error at readApplicationContentFileCallback' + error)
            res.status(200).json({ 'error': error });
        });
    }
    catch (exception) {
        console.error("Exception at readApplicationContentFileCallback - " + exception)
        res.status(200).json({ 'Exception': exception });
    }
}
function ReadApplicationContentFile() {

    var parser = require('xml2js');
    var PageContents = {};
    var Response = {};
    Response.Content = {}
    var promiseObject = new Promise(function (resolve, reject) {
        try {
            var data = fs.readFileSync(tempConfig.ApplicationConstant.ContentFilePath);
            parser.parseString(data, function (err, result) {
                if (err) {
                    reject(err);
                }
                for (var iCount = 0; iCount < result.PageContents.PageContent.length; iCount++) {
                    PageContent = result.PageContents.PageContent[iCount];
                    console.log(PageContent);
                    if (PageContent.$.id !== '') {
                        if (PageContent.$.Type === tempConfig.ApplicationConstant.ContentType.Array) {
                            Response.Content[PageContent.$.id] = [];
                            for (var jCount = 0; jCount < PageContent.Content.length; jCount++) {
                                Response.Content[PageContent.$.id].push(PageContent.Content[jCount].$);
                            }
                        }
                        else if (PageContent.$.Type === tempConfig.ApplicationConstant.ContentType.Object) {
                            Response.Content[PageContent.$.id] = {}
                            for (var jCount = 0; jCount < PageContent.Content.length; jCount++) {
                                Response.Content[PageContent.$.id][PageContent.Content[jCount].$.HeaderText] = PageContent.Content[jCount].$.DescriptionText;
                            }

                        }
                    }
                }
                resolve(Response);
            });

        }
        catch (exception) {
            reject(exception);
        }
    });
    return promiseObject;

}
//#endregion

function notifyCustomerCallback(req, res, config) {
    try {
        tempConfig = config;
        NotifyCustomer(req).then(function (data) {
            res.status(200).json(data);
        }, function (error) {
            console.log(new Date().toLocaleString());
            console.error('Error at notifyCustomerCallback' + error)
            res.status(200).json({ 'Error': error });
        });

    }
    catch (exception) {
        console.error("Exception at notifyCustomerCallback - " + exception)
        res.status(200).json({ 'Exception': exception });
    }
}

function NotifyCustomer(req) {
    var uiRequest = null;
    if (req !== undefined && req !== null && req.body !== undefined && req.body !== null) {
        uiRequest = JSON.parse(Object.keys(req.body)[0]);
        console.log(uiRequest);
    }
    var promiseObject = new Promise(function (resolve, reject) {
        try {
            //uiRequest = null;
            if (uiRequest === null || uiRequest === undefined || uiRequest.NotifyRequest === null || uiRequest.NotifyRequest === undefined) {
                configureNotifyResponse('', '', null, resolve);
            }
            notifyRequest = uiRequest.NotifyRequest;
            if (notifyRequest.TextMessageStatus === tempConfig.AppSetting.MSGConfiguration.Status && notifyRequest.TextMessageRequests !== null && notifyRequest.TextMessageRequests !== undefined && notifyRequest.TextMessageRequests.length > 0) {

                // notifyRequest.TextMessageRequests.forEach(function (TextMessageRequest) {
                //     sendTextMessage(TextMessageRequest);
                // }, this);

                // for (var iCount = 0; iCount < notifyRequest.TextMessageRequests.length; iCount++) {
                //     var returnTMTemplate = ConfigureMessageTemplate(notifyRequest.TextMessageRequests[iCount], uiRequest);
                //     notifyRequest.TextMessageRequests[iCount] = returnTMTemplate;
                //     //  sendTextMessage(returnTMTemplate);
                // }
            }
            if (notifyRequest.EmailStatus === tempConfig.AppSetting.EmailConfiguration.Status && notifyRequest.EmailRequests !== null && notifyRequest.EmailRequests !== undefined && notifyRequest.TextMessageRequests.length > 0) {
                // notifyRequest.EmailRequests.forEach(function (EmailRequest) {
                //     ConfigureMessageTemplate(EmailRequest, uiRequest);
                //     sendMail(EmailRequest);
                // }, this);
                for (var iCount = 0; iCount < notifyRequest.EmailRequests.length; iCount++) {
                    // var promiseInt = new Promise(function (resolveInt, rejectInt) {
                    ConfigureMessageTemplate(notifyRequest.EmailRequests[iCount], uiRequest, resolve);
                    // });
                }
            }


        }
        catch (exception) {
            configureNotifyResponse('Failed', 'Exception', exception, resolve);
        }
    }).then(

        function (params) {
            return notifyRequest;
        }
        );
}
module.exports = {
    notifyCustomerCallback, readApplicationContentFileCallback
}

function ConfigureMessageTemplate(replaceObject, uiRequest, resolve) {
    var EmailReplaceObjects = [
        { '[@FULLNAME@]': uiRequest.FullName },
        { '[@REQUESTTYPE@]': uiRequest.RequestType },
        { '[@VEHICLE@]': uiRequest.Vehicle },
        { '[@TRAVELDATE@]': uiRequest.TravelDate },
        { '[@DOMAIN@]': uiRequest.Domain },
        { '[@CONTACTUSPHONE@]': uiRequest.ContactUsPhoneNumber },
        { '[@TRAVELREFERENVENUMBER@]': uiRequest.TravelReferenceNumber },
        { '[@CAB_TOPLACE@]': uiRequest.Cab_ToPlace },
        { '[@CAB_FROMPLACE@]': uiRequest.Cab_FromPlace },
        { '[@PHONENUMBER@]': uiRequest.PhoneNumber },
        { '[@TRIP_NUMBEROFDAYS@]': uiRequest.Trip_NumberOfDays },
        { '[@TRIP_PLACES@]': uiRequest.Trip_Places }
    ]

    if (replaceObject.EmailSubject)
        replaceObject.EmailSubject = ReplacingString(replaceObject.EmailSubject, EmailReplaceObjects);
    if (replaceObject.EmailTemplate_Name) {
        replaceObject.EmailTemplate_Name = ('./' + replaceObject.EmailTemplate_Name)
        fs.readFile(replaceObject.EmailTemplate_Name, 'utf8', function (err, data) {
            if (err) throw err;
            replaceObject.EmailTemplate = ReplacingString(data, EmailReplaceObjects);
            sendMail(replaceObject, resolve);
            return;
        });

    }
    if (replaceObject.TMessageContent) {
        replaceObject.TMessageContent = ReplacingString(replaceObject.TMessageContent, EmailReplaceObjects);
        sendTextMessage(replaceObject, resolve);
        return;
    }


}

function sendTextMessage(textMessageRequest, resolve) {
    var https = require('https');
    https.get("https://control.msg91.com/api/sendhttp.php?authkey=145593ArGVeQsElLKz58f83ef4&mobiles=919980836494&message=" + textMessageRequest.TMessageContent + "&sender=HEMSNG&route=4&country=91&response=json", function (res) {
        var body = "";
        res.on('data', function (data) {
            body += data;
        });
        res.on('end', function () {
            var response = JSON.parse(body);
            textMessageRequest.Response = response;
            configureNotifyResponse(tempConfig.ApplicationConstant.Status.Success, tempConfig.ApplicationConstant.NotificationType.TextMessage, textMessageRequest, resolve);

        })
    })
        .on('error', function (error) {
            textMessageRequest.Response = error;
            configureNotifyResponse(tempConfig.ApplicationConstant.Status.Failure, tempConfig.ApplicationConstant.NotificationType.TextMessage, textMessageRequest, resolve);
        })
}

function sendMail(mailRequest, resolve) {

    if (mailRequest === null || mailRequest === undefined) {
        configureNotifyResponse(tempConfig.ApplicationConstant.Status.Failure, tempConfig.ApplicationConstant.NotificationType.Email, error, resolve);
    }
    var nodemailer = require("nodemailer");
    var smtpTransport = nodemailer.createTransport({
        service: tempConfig.AppSetting.EmailConfiguration.EmailService,
        auth: {
            user: tempConfig.AppSetting.EmailConfiguration.SourceEmailId,
            pass: tempConfig.AppSetting.EmailConfiguration.SouceEmailKey
        }
    });
    var mailOptions = {
        from: mailRequest.EmailToEmailId,
        to: 'hemanth.n.govindan@outlook.com;' + mailRequest.EmailToEmailId,
        subject: mailRequest.EmailSubject,
        html: mailRequest.EmailTemplate
    };
    smtpTransport.sendMail(mailOptions, function (error, response) {
        smtpTransport.close();
        if (error) {
            mailRequest.Response = error;
            configureNotifyResponse(tempConfig.ApplicationConstant.Status.Failure, tempConfig.ApplicationConstant.NotificationType.Email, mailRequest, resolve);
        }
        else {
            mailRequest.Response = response;
            configureNotifyResponse(tempConfig.ApplicationConstant.Status.Success, tempConfig.ApplicationConstant.NotificationType.Email, mailRequest, resolve);
        }

    })

}

function configureNotifyResponse(status, notificationType, data, resolve) {

    var Status = {};
    switch (status) {
        case 'Success':
            Status.StatusCode = tempConfig.ApplicationConstant.StatusCodes['000'];
            Status.StatusDesc = tempConfig.ApplicationConstant.StatusCodes.Success;
            break;
        case 'Failed':
            Status.StatusCode = tempConfig.ApplicationConstant.StatusCodes['001'];
            Status.StatusDesc = tempConfig.ApplicationConstant.StatusCodes.Failed;
            break;
        default:
            Status.StatusCode = tempConfig.ApplicationConstant.StatusCodes['002'];
            Status.StatusDesc = 'None of the notifications are configured';
            break;
    }
    if (notificationType === tempConfig.ApplicationConstant.NotificationType.TextMessage) {
        notifyRequest.TextMessageCount--;
        notifyRequest.TextMessageRequests.forEach(function (TextMessageRequest, index) {
            if (TextMessageRequest.TMessageId === data.TMessageId) {
                notifyRequest.TextMessageRequests[index].Data = data;
            }
        }, this);
        if (notifyRequest.EmailCount + notifyRequest.TextMessageCount <= 0 || (notifyRequest.TextMessageCount <= 0 && notifyRequest.EmailStatus !== tempConfig.AppSetting.EmailConfiguration.Status)) {
            resolve(NotifyResponse);
        }
    }
    else if (notificationType === tempConfig.ApplicationConstant.NotificationType.Email) {
        notifyRequest.EmailCount--;
        notifyRequest.EmailRequests.forEach(function (EmailRequest, index) {
            if (EmailRequest.EmailId === data.EmailId) {
                notifyRequest.EmailRequests[index].Data = data;
            }
        }, this);
        if (notifyRequest.EmailCount + notifyRequest.TextMessageCount <= 0 || (notifyRequest.EmailCount <= 0 && notifyRequest.TextMessageStatus !== tempConfig.AppSetting.MSGConfiguration.Status)) {
            resolve(notifyRequest);
        }
    }
    else {
        resolve(notifyRequest);
    }

}

function ReplacingString(stringValue, ...Objects) {
    Objects.forEach(function (replaceObject) {
        replaceObject.forEach(function (replaceObj) {
            var text = replaceObj;
            var name = Object.keys(replaceObj);
            var name2 = replaceObj[Object.keys(replaceObj)];
            var setv = new RegExp(Object.keys(replaceObj), 'g');
            stringValue = stringValue.replace(Object.keys(replaceObj), replaceObj[Object.keys(replaceObj)]);
            stringValue = stringValue.replace(Object.keys(replaceObj), replaceObj[Object.keys(replaceObj)]);
        })
    });
    return stringValue;
}

