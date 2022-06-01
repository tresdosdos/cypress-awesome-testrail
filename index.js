const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');
const axios = require("axios");
const TestRail = require('./test-rail');

const {
    EVENT_RUN_BEGIN,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
} = Mocha.Runner.constants;

class MyReporter {
    integrationFolder = 'cypress/integration/';
    screenshotsFolder = 'cypress/screenshots/';
    apiUrl = '';
    options = {};

    get authHeader() {
        return 'Basic ' + Buffer.from(this.options.username + ":" + this.options.password).toString('base64');
    }

    get apiClient() {
        return axios.create({
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json'
            },
            baseURL: this.apiUrl,
        });
    }

    get testRail() {
        return new TestRail(this.apiClient, this.options);
    }

    constructor(runner, options) {
        this.options = options.reporterOptions;

        runner
            .once(EVENT_RUN_BEGIN, async () => {
                this.apiUrl = `${this.options.domain}/index.php?/api/v2/`;
            })
            .on(EVENT_TEST_PASS, async test => {
                await this.testRail.addResult(this.getCaseId(test), 'pass');
            })
            .on(EVENT_TEST_FAIL, async (test, err) => {
                const parentTitle = test.parent.title;
                const title = test.title;
                const filePath = err.codeFrame.originalFile.slice(err.codeFrame.originalFile.indexOf(this.integrationFolder) + this.integrationFolder.length);
                const pathToAttachment = `${filePath}/${parentTitle} -- ${title} (failed).png`;
                const caseId = this.getCaseId(test);
                await this.testRail.addResult(caseId, 'fail');
                const res = await this.testRail.getCaseResults(this.options.testRunId, caseId)
                await this.testRail.addAttachment(res.data.results[0].id, fs.createReadStream(path.join(__dirname, `../../${this.screenshotsFolder}${pathToAttachment}`)));
            })
    }

    getCaseId(test) {
        return test.title.split(' ')[0].slice(1);
    }
}

module.exports = MyReporter;
