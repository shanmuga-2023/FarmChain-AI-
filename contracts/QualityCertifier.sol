// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QualityCertifier
 * @dev Role-gated issuing of Organic, FSSAI, and AGMARK quality certificates on the blockchain.
 */
contract QualityCertifier {
    struct Certificate {
        string certId;
        string productId;
        string certType; // "Organic (NPOP)", "AGMARK Grade A", "FSSAI Food Safety", "GI Tag Verified"
        string grade;    // "A+", "A", "B"
        string issuerName;
        address issuerAddress;
        string ipfsReportUrl;
        uint256 validUntil;
        bool isValid;
        uint256 issuedAt;
    }

    address public admin;
    mapping(address => bool) public authorizedInspectors;
    mapping(string => Certificate[]) private productCertificates;
    mapping(string => Certificate) public certificatesById;

    event InspectorAuthorized(address indexed inspector, string organization);
    event CertificateIssued(string indexed certId, string indexed productId, string certType, string grade, address issuer);
    event CertificateRevoked(string indexed certId, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyInspector() {
        require(authorizedInspectors[msg.sender] || msg.sender == admin, "Caller is not an authorized certifier");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedInspectors[msg.sender] = true;
    }

    function authorizeInspector(address _inspector, string memory _org) external onlyAdmin {
        authorizedInspectors[_inspector] = true;
        emit InspectorAuthorized(_inspector, _org);
    }

    function issueCertificate(
        string memory _certId,
        string memory _productId,
        string memory _certType,
        string memory _grade,
        string memory _issuerName,
        string memory _ipfsReportUrl,
        uint256 _validityDurationSeconds
    ) external onlyInspector returns (bool) {
        require(bytes(_certId).length > 0, "Invalid Cert ID");

        Certificate memory cert = Certificate({
            certId: _certId,
            productId: _productId,
            certType: _certType,
            grade: _grade,
            issuerName: _issuerName,
            issuerAddress: msg.sender,
            ipfsReportUrl: _ipfsReportUrl,
            validUntil: block.timestamp + _validityDurationSeconds,
            isValid: true,
            issuedAt: block.timestamp
        });

        productCertificates[_productId].push(cert);
        certificatesById[_certId] = cert;

        emit CertificateIssued(_certId, _productId, _certType, _grade, msg.sender);
        return true;
    }

    function revokeCertificate(string memory _certId, string memory _reason) external onlyAdmin {
        require(certificatesById[_certId].issuedAt > 0, "Certificate does not exist");
        certificatesById[_certId].isValid = false;
        emit CertificateRevoked(_certId, _reason);
    }

    function getProductCertificates(string memory _productId) external view returns (Certificate[] memory) {
        return productCertificates[_productId];
    }
}
