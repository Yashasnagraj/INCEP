// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IPFSStorage {
    struct File {
        string ipfsHash;
        string fileName;
        address uploader;
    }

    File[] public files;

    event FileUploaded(string ipfsHash, string fileName, address uploader);

    function storeFile(string memory _ipfsHash, string memory _fileName) public {
        files.push(File(_ipfsHash, _fileName, msg.sender));
        emit FileUploaded(_ipfsHash, _fileName, msg.sender);
    }

    function getFiles() public view returns (File[] memory) {
        return files;
    }
}
