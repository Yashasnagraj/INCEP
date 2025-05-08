// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FileAccess is Ownable, ReentrancyGuard {
    struct File {
        string cid;
        address owner;
        mapping(address => bool) doctorAccess;
        bool exists;
    }

    mapping(string => File) public files;
    mapping(address => bool) public verifiedDoctors;

    event FileAdded(string cid, address owner);
    event AccessGranted(string cid, address doctor);
    event AccessRevoked(string cid, address doctor);
    event DoctorVerified(address doctor);

    modifier onlyVerifiedDoctor() {
        require(verifiedDoctors[msg.sender], "Not a verified doctor");
        _;
    }

    modifier fileExists(string memory cid) {
        require(files[cid].exists, "File does not exist");
        _;
    }

    function addFile(string memory cid) external {
        require(!files[cid].exists, "File already exists");
        
        File storage newFile = files[cid];
        newFile.cid = cid;
        newFile.owner = msg.sender;
        newFile.exists = true;

        emit FileAdded(cid, msg.sender);
    }

    function verifyDoctor(address doctor) external onlyOwner {
        verifiedDoctors[doctor] = true;
        emit DoctorVerified(doctor);
    }

    function grantAccess(string memory cid, address doctor) 
        external 
        fileExists(cid) 
    {
        require(msg.sender == files[cid].owner, "Not file owner");
        require(verifiedDoctors[doctor], "Doctor not verified");
        
        files[cid].doctorAccess[doctor] = true;
        emit AccessGranted(cid, doctor);
    }

    function revokeAccess(string memory cid, address doctor) 
        external 
        fileExists(cid) 
    {
        require(msg.sender == files[cid].owner, "Not file owner");
        files[cid].doctorAccess[doctor] = false;
        emit AccessRevoked(cid, doctor);
    }

    function checkAccess(string memory cid, address doctor) 
        external 
        view 
        fileExists(cid) 
        returns (bool) 
    {
        return files[cid].doctorAccess[doctor];
    }
} 