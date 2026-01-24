// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MedChain - Medical Record Sharing System
 * @notice Advanced blockchain-based medical record management with access control
 * @dev Implements patient-controlled sharing with time-based permissions and audit trails
 */
contract MedChain {
    
    // ==================== ENUMS & STRUCTS ====================
    
    enum UserRole { None, Patient, Doctor, Admin }
    
    struct User {
        address userAddress;
        string name;
        UserRole role;
        bool isRegistered;
        uint256 registrationTime;
    }
    
    struct MedicalRecord {
        uint256 recordId;
        address patientAddress;
        string ipfsHash;           // IPFS hash of encrypted medical file
        string recordType;         // e.g., "Lab Report", "X-Ray", "Prescription"
        string description;
        uint256 timestamp;
        bool exists;
    }
    
    struct AccessPermission {
        address doctorAddress;
        uint256 grantedAt;
        uint256 expiresAt;         // 0 means no expiry
        bool isActive;
        string purpose;            // Reason for access
    }
    
    struct AuditLog {
        address accessor;
        uint256 recordId;
        uint256 timestamp;
        string action;             // "VIEW", "GRANT", "REVOKE"
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(address => User) public users;
    mapping(address => uint256[]) public patientRecords;
    mapping(uint256 => MedicalRecord) public records;
    mapping(address => mapping(address => AccessPermission)) public permissions; // patient => doctor => permission
    mapping(address => AuditLog[]) public auditTrails;
    
    uint256 public recordCounter;
    address public admin;
    bool public emergencyMode;
    
    // ==================== EVENTS ====================
    
    event UserRegistered(address indexed userAddress, string name, UserRole role);
    event RecordCreated(uint256 indexed recordId, address indexed patient, string recordType);
    event AccessGranted(address indexed patient, address indexed doctor, uint256 expiresAt);
    event AccessRevoked(address indexed patient, address indexed doctor);
    event RecordAccessed(address indexed accessor, uint256 indexed recordId);
    event EmergencyModeToggled(bool status);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        _;
    }
    
    modifier onlyPatient() {
        require(users[msg.sender].role == UserRole.Patient, "Only patients allowed");
        _;
    }
    
    modifier onlyDoctor() {
        require(users[msg.sender].role == UserRole.Doctor, "Only doctors allowed");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }
    
    modifier recordExists(uint256 _recordId) {
        require(records[_recordId].exists, "Record does not exist");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        admin = msg.sender;
        emergencyMode = false;
        
        // Register admin
        users[admin] = User({
            userAddress: admin,
            name: "System Admin",
            role: UserRole.Admin,
            isRegistered: true,
            registrationTime: block.timestamp
        });
    }
    
    // ==================== USER MANAGEMENT ====================
    
    /**
     * @notice Register a new user (patient or doctor)
     * @param _name User's full name
     * @param _role Role (1 = Patient, 2 = Doctor)
     */
    function registerUser(string memory _name, UserRole _role) external {
        require(!users[msg.sender].isRegistered, "User already registered");
        require(_role == UserRole.Patient || _role == UserRole.Doctor, "Invalid role");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            name: _name,
            role: _role,
            isRegistered: true,
            registrationTime: block.timestamp
        });
        
        emit UserRegistered(msg.sender, _name, _role);
    }
    
    /**
     * @notice Get user information
     * @param _userAddress Address of the user
     */
    function getUserInfo(address _userAddress) external view returns (
        string memory name,
        UserRole role,
        bool isRegistered,
        uint256 registrationTime
    ) {
        User memory user = users[_userAddress];
        return (user.name, user.role, user.isRegistered, user.registrationTime);
    }
    
    // ==================== MEDICAL RECORDS ====================
    
    /**
     * @notice Create a new medical record
     * @param _ipfsHash IPFS hash of the encrypted medical file
     * @param _recordType Type of medical record
     * @param _description Brief description
     */
    function createRecord(
        string memory _ipfsHash,
        string memory _recordType,
        string memory _description
    ) external onlyRegistered onlyPatient returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        
        recordCounter++;
        
        records[recordCounter] = MedicalRecord({
            recordId: recordCounter,
            patientAddress: msg.sender,
            ipfsHash: _ipfsHash,
            recordType: _recordType,
            description: _description,
            timestamp: block.timestamp,
            exists: true
        });
        
        patientRecords[msg.sender].push(recordCounter);
        
        // Log creation
        _addAuditLog(msg.sender, recordCounter, "CREATE");
        
        emit RecordCreated(recordCounter, msg.sender, _recordType);
        return recordCounter;
    }
    
    /**
     * @notice Get patient's all record IDs
     * @param _patient Patient address
     */
    function getPatientRecordIds(address _patient) external view returns (uint256[] memory) {
        return patientRecords[_patient];
    }

    /**
     * @notice Get all records accessible to a doctor
     * @dev Used by doctors to view records they have access to
     * @param _doctor Doctor address
     */
    function getDoctorAccessibleRecords(address _doctor) external view onlyDoctor returns (uint256[] memory) {
        require(_doctor == msg.sender, "Can only check your own accessible records");
        
        uint256[] memory accessibleRecords = new uint256[](recordCounter);
        uint256 count = 0;
        
        // Iterate through all records and check if doctor has access
        for (uint256 i = 1; i <= recordCounter; i++) {
            if (records[i].exists) {
                address patientAddress = records[i].patientAddress;
                // Check if doctor has access to this patient's records
                if (_hasAccess(patientAddress, _doctor, i)) {
                    accessibleRecords[count] = i;
                    count++;
                }
            }
        }
        
        // Create array with exact size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = accessibleRecords[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get record details (only if authorized)
     * @param _recordId ID of the record
     */
    function getRecord(uint256 _recordId) external view recordExists(_recordId) returns (
        address patient,
        string memory ipfsHash,
        string memory recordType,
        string memory description,
        uint256 timestamp
    ) {
        MedicalRecord memory record = records[_recordId];
        
        // Check authorization
        require(
            msg.sender == record.patientAddress || 
            _hasAccess(record.patientAddress, msg.sender, _recordId) ||
            (emergencyMode && users[msg.sender].role == UserRole.Doctor) ||
            msg.sender == admin,
            "Unauthorized access"
        );
        
        return (
            record.patientAddress,
            record.ipfsHash,
            record.recordType,
            record.description,
            record.timestamp
        );
    }
    
    // ==================== ACCESS CONTROL ====================
    
    /**
     * @notice Grant access to a doctor
     * @param _doctor Doctor's address
     * @param _expiryDuration Duration in seconds (0 for no expiry)
     * @param _purpose Purpose of access
     */
    function grantAccess(
        address _doctor,
        uint256 _expiryDuration,
        string memory _purpose
    ) external onlyRegistered onlyPatient {
        require(users[_doctor].role == UserRole.Doctor, "Can only grant to doctors");
        require(users[_doctor].isRegistered, "Doctor not registered");
        
        uint256 expiresAt = _expiryDuration > 0 ? block.timestamp + _expiryDuration : 0;
        
        permissions[msg.sender][_doctor] = AccessPermission({
            doctorAddress: _doctor,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            purpose: _purpose
        });
        
        // Log access grant
        _addAuditLog(msg.sender, 0, "GRANT_ACCESS");
        
        emit AccessGranted(msg.sender, _doctor, expiresAt);
    }
    
    /**
     * @notice Revoke access from a doctor
     * @param _doctor Doctor's address
     */
    function revokeAccess(address _doctor) external onlyRegistered onlyPatient {
        require(permissions[msg.sender][_doctor].isActive, "No active permission");
        
        permissions[msg.sender][_doctor].isActive = false;
        
        // Log access revocation
        _addAuditLog(msg.sender, 0, "REVOKE_ACCESS");
        
        emit AccessRevoked(msg.sender, _doctor);
    }
    
    /**
     * @notice Check if doctor has access to patient's records
     * @param _patient Patient address
     * @param _doctor Doctor address
     */
    function checkAccess(address _patient, address _doctor) external view returns (
        bool hasAccess,
        uint256 grantedAt,
        uint256 expiresAt,
        string memory purpose
    ) {
        AccessPermission memory perm = permissions[_patient][_doctor];
        
        bool isValid = perm.isActive && 
                      (perm.expiresAt == 0 || perm.expiresAt > block.timestamp);
        
        return (isValid, perm.grantedAt, perm.expiresAt, perm.purpose);
    }
    
    /**
     * @notice Internal function to check access
     */
    function _hasAccess(address _patient, address _doctor, uint256 _recordId) internal view returns (bool) {
        AccessPermission memory perm = permissions[_patient][_doctor];
        
        if (!perm.isActive) return false;
        if (perm.expiresAt > 0 && perm.expiresAt <= block.timestamp) return false;
        
        return true;
    }
    
    // ==================== AUDIT TRAIL ====================
    
    /**
     * @notice Add audit log entry
     */
    function _addAuditLog(address _accessor, uint256 _recordId, string memory _action) internal {
        auditTrails[_accessor].push(AuditLog({
            accessor: _accessor,
            recordId: _recordId,
            timestamp: block.timestamp,
            action: _action
        }));
    }
    
    /**
     * @notice Get audit trail for a user
     * @param _user User address
     */
    function getAuditTrail(address _user) external view returns (AuditLog[] memory) {
        return auditTrails[_user];
    }
    
    // ==================== EMERGENCY ACCESS ====================
    
    /**
     * @notice Toggle emergency mode (admin only)
     * @dev In emergency mode, all doctors can access all records
     */
    function toggleEmergencyMode() external onlyAdmin {
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 totalRecords,
        bool emergencyStatus
    ) {
        return (recordCounter, emergencyMode);
    }
}
