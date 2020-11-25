pragma solidity >=0.6.6 < 0.8.0;
pragma experimental ABIEncoderV2;
contract CampaignFactory {
    Campaign[] public deployedCampaigns;

    function createCampaign(uint minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (Campaign[] memory) {
        return deployedCampaigns;
    }
}
contract Campaign {
    struct Request {
        string description;
        uint amount;
        address recipient;
        bool complete;
        uint approval_count;
    }
    // mapping cannot be declared inside the struct,
    // therefore this program use request index and address as a pointer instead.
    mapping(uint => mapping(address => bool)) approvals;

    address public manager;
    uint public minimumContribution;
    //address[] public approvers;
    mapping (address => bool) public approvers;
    Request[] public requests;
    uint approvers_count;
    modifier restricted() {
        require(msg.sender == manager);
        _;
    }
    
    //constructor (uint minimum) public {
    constructor (uint minimum, address creator) public payable{
        //manager = msg.sender;
        manager = creator;
        minimumContribution = minimum;
    }
    
    function contribute() public payable {
        require(msg.value >= minimumContribution);
        //approvers.push(msg.sender);
        approvers[msg.sender] = true;
        approvers_count++;
    }

    function createRequest(string memory _description, uint _amount, address _recipient) public restricted {
        Request memory new_request = Request({
            description: _description,
            amount: _amount,
            recipient: _recipient,
            complete: false,
            approval_count: 0
        });

        requests.push(new_request);
    }

    function approveRequest(uint index) public {
        Request storage request = requests[index];

        // @dev: check if being one of the approvers
        require(approvers[msg.sender]);
        // @dev: check if have not approved before
        // @old: require(!request.approvals[msg.sender]);
        require(!approvals[index][msg.sender]);

        // @dev: update status to already approved
        // @old: request.approvals[msg.sender] = true;
        approvals[index][msg.sender] = true;
        request.approval_count++;
    }

    function finalizeRequest(uint index) public payable restricted {
        Request storage request = requests[index];

        // @dev: check if majority agrees with the request
        require(request.approval_count > (approvers_count / 2));
        // @dev: check if have not done before
        require(!request.complete);
        address payable rec = payable (request.recipient);

        //request.recipient.transfer(request.amount);
        rec.transfer(request.amount);
        request.complete = true;
    }

    function getRequests() public view returns (Request[] memory) {
        return requests;
    }
}