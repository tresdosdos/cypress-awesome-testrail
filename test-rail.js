const FormData = require('form-data');

class TestRail {
    apiClient = null;
    options = {};
    statuses = {
        pass: 1,
        fail: 5,
        untest: 3,
    }

    constructor(apiClient, options) {
        this.apiClient = apiClient;
        this.options = options;
    }

    createTestRun() {
        return this.apiClient.post(`add_run/${this.options.projectId}`, {
            suite_id: this.options.suiteId,
            name: 'Automated Test Run ' + new Date().toISOString(),
            include_all: true,
        })
    }

    addResult(caseId, type) {
        return this.apiClient.post(`add_result_for_case/${this.options.testRunId}/${caseId}`, {
            status_id: this.statuses[type],
        })
    }

    addAttachment(resultId, stream) {
        const formData = new FormData();
        formData.append('attachment', stream)
        return this.apiClient.post(`add_attachment_to_result/${resultId}`, formData);
    }

    getCaseResults(runId, caseId) {
        return this.apiClient.get(`get_results_for_case/${runId}/${caseId}`)
    }

    closeRun(runId) {
        return this.apiClient.post(`close_run/${runId}`);
    }
}

module.exports = TestRail;
