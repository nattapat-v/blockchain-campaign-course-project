const assert = require("assert");
const ganache = require("ganache-cli");
const fs = require("fs");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const bytecode_factory = fs.readFileSync('./build/__contracts_campaign_sol_CampaignFactory.bin');
const abi_factory = JSON.parse(fs.readFileSync('./build/__contracts_campaign_sol_CampaignFactory.abi'));

const bytecode_campaign = fs.readFileSync('./build/__contracts_campaign_sol_Campaign.bin')
const abi_campaign = JSON.parse(fs.readFileSync('./build/__contracts_campaign_sol_Campaign.abi'))

var accounts;
var factory;
var campaign;

beforeEach(async () => { 
    accounts = await web3.eth.getAccounts();

    factory = await new web3.eth.Contract(abi_factory)
                                .deploy({data: '0x'+bytecode_factory})
                                .send({from: accounts[0], gas:'2000000'});

    campaign = await new web3.eth.Contract(abi_campaign)
                                .deploy({data: '0x'+bytecode_campaign, arguments: [55555, accounts[0]]})
                                .send({from: accounts[0], gas:'2000000'});
});

describe('CAMPAIGN FACTORY',() => { 
    it('deploys a factory and a campaign contract', () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });
    it('campaign is created by factory function',async ()=> {
        await factory.methods
                        .createCampaign(55555)
                        .send({from: accounts[0], gas: '2000000'});

        const campaign = await factory.methods
                                        .getDeployedCampaigns()
                                        .call();
                                        
        assert.ok(campaign[0] != null);
    });
    it('minimum contribution is set by campaign constructor', async ()=> {
        const minimum = await campaign.methods.minimumContribution().call();
        assert.strictEqual(minimum, '55555');
    });
    it('manager is the campaign creator', async ()=> {
        const manager = await campaign.methods.manager().call();
        assert.strictEqual(manager, accounts[0]);
    });
    it('the given value must >= minimum in order to be a contributor', async ()=> {
        const value = 44444;
        var status = 'not pass';
        try {
            await campaign.methods
                            .contribute()
                            .send({from: accounts[1], gas: '1000000', value: value});
        } catch (error) {
            status = 'pass';
        }
        assert.strictEqual(status, 'pass');
    });
    it('request can only be created by manager', async ()=> {
        var status = 'not pass';
        try {
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[1], gas: '1000000'});
        } catch (error) {
            status = 'pass';
        }
        assert.strictEqual(status, 'pass')
    });
    it('request can only be approved by approver', async ()=> {
        var status = 'not pass';

        // manager creates request
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[0], gas: '1000000'});
        
        // let accounts[1] be the only approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[1], gas: '1000000', value: 55555});
        
        // accounts[2] should not be able to approve the request
        try {
            await campaign.methods
                            .approveRequest(0)
                            .send({from: accounts[2], gas: '1000000'});
        } catch (error) {
            status = 'pass';
        }
        assert.strictEqual(status, 'pass');
    });
    it('once approver approved the request, the approver cannot approve the same request again', async() => {
        var status = 'not pass';

        // manager creates request
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[0], gas: '1000000'});
        
        // let accounts[1] be the only approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[1], gas: '1000000', value: 55555});                
        
        // accounts[1] approved the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[1], gas: '1000000'});
        
        // accounts[1] should not be able to approve the same request again
        try {
            await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[1], gas: '1000000'});
        } catch (error) {
            status = 'pass';
        }
        assert.strictEqual(status, 'pass');
    })
    it('the request required more than half of the approvers in order to be execute', async() => {
        var status = 'not pass';

        // the manager creates the request
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[0], gas: '1000000'});
        
        // accounts[1] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[1], gas: '1000000', value: 55555});
        
        // accounts[2] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[2], gas: '1000000', value: 55555});

        // accounts[3] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[3], gas: '1000000', value: 55555});

        // accounts[1] approves the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[1], gas: '1000000'});

        // since only one-third of the approvers approved the request, the manager cannot execute the request
        try {
            await campaign.methods
                            .finalizeRequest(0)
                            .send({from: accounts[0], gas: '1000000'});
        } catch (error) {
            status = 'pass';
        }
        assert.strictEqual(status, 'pass');
    });
    it('once the manager finalized the request, it cannot be finalized again', async() => {
        var status = 'not pass';

        // the manager creates the request
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[0], gas: '1000000'});
        
        // accounts[1] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[1], gas: '1000000', value: 55555});
        
        // accounts[2] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[2], gas: '1000000', value: 55555});

        // accounts[3] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[3], gas: '1000000', value: 55555});

        // accounts[1] approves the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[1], gas: '1000000'});

        // accounts[2] approves the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[2], gas: '1000000'});

        // the manager finalized the request
        await campaign.methods
                        .finalizeRequest(0)
                        .send({from: accounts[0], gas: '1000000'});
        
        // since the request has been finalized, therefore it cannot be finalized again
        try {
            await campaign.methods
                            .finalizeRequest(0)
                            .send({from: accounts[0], gas: '1000000'});
        } catch (error) {
            status = 'pass'
        }
        assert.strictEqual(status, 'pass');
    });
    it('the request can only be finalized by the manager', async() => {
        var status = 'not pass';

        // the manager creates the request
        await campaign.methods
                        .createRequest('air ticket', 1999, accounts[2])
                        .send({from: accounts[0], gas: '1000000'});
        
        // accounts[1] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[1], gas: '1000000', value: 55555});
        
        // accounts[2] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[2], gas: '1000000', value: 55555});

        // accounts[3] becomes a approver
        await campaign.methods
                        .contribute()
                        .send({from: accounts[3], gas: '1000000', value: 55555});

        // accounts[1] approves the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[1], gas: '1000000'});

        // accounts[2] approves the request
        await campaign.methods
                        .approveRequest(0)
                        .send({from: accounts[2], gas: '1000000'});

        // non-manager should not be able to finalize the request
        try {
            await campaign.methods
                            .finalizeRequest(0)
                            .send({from: accounts[1], gas: '1000000'});
        } catch (error) {
            status = 'pass'
        }
        assert.strictEqual(status, 'pass');
    });
});