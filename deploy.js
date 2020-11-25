const fs = require("fs");
const Web3 = require("web3");
const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

const bytecode_factory = fs.readFileSync('./build/__contracts_campaign_sol_CampaignFactory.bin');
const abi_factory = JSON.parse(fs.readFileSync('./build/__contracts_campaign_sol_CampaignFactory.abi'));

const bytecode_campaign = fs.readFileSync('./build/__contracts_campaign_sol_Campaign.bin')
const abi_campaign = JSON.parse(fs.readFileSync('./build/__contracts_campaign_sol_Campaign.abi'))

var accounts;
var factory;
var campaign;

const deploy = async() => {
    accounts = await web3.eth.getAccounts()
    await web3.eth.personal.unlockAccount(accounts[0], "password1", 0);

    factory = await new web3.eth.Contract(abi_factory)
                                .deploy({data: '0x'+bytecode_factory})
                                .send({from: accounts[0], gas:'2000000'});

    campaign = await new web3.eth.Contract(abi_campaign)
                                .deploy({data: '0x'+bytecode_campaign, arguments: [55555, accounts[0]]})
                                .send({from: accounts[0], gas:'2000000'});

    console.log('factory contract is deployed to',factory.options.address);
    console.log('campaign contract is deployed to', campaign.options.address); 
};
deploy();