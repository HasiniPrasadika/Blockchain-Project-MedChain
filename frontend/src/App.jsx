import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  FileText, 
  UserPlus, 
  Shield, 
  Clock, 
  Activity,
  Upload,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Stethoscope,
  Database,
  Lock,
  Unlock
} from 'lucide-react';
import './App.css';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './config';

function App() {
  // State Management
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [records, setRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, emergencyStatus: false });

  // Form States
  const [registerForm, setRegisterForm] = useState({ name: '', role: '1' });
  const [recordForm, setRecordForm] = useState({
    ipfsHash: '',
    recordType: '',
    description: ''
  });
  const [accessForm, setAccessForm] = useState({
    doctorAddress: '',
    duration: '2592000', // 30 days default
    purpose: ''
  });

  // Initialize Web3
  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountChange);
        window.ethereum.on('chainChanged', () => window.location.reload());
      } catch (error) {
        console.error('Error initializing Web3:', error);
      }
    } else {
      alert('Please install MetaMask to use this application!');
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Switch to Sepolia network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
        });
      } catch (switchError) {
        // If chain doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia',
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://sepolia.etherscan.io/']
            }],
          });
        }
      }
      
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3Signer = await provider.getSigner();
      setSigner(web3Signer);
      setAccount(accounts[0]);

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        web3Signer
      );
      setContract(contractInstance);

      // Check if user is registered
      await loadUserInfo(contractInstance, accounts[0]);
      await loadStats(contractInstance);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount('');
      setUserInfo(null);
      setContract(null);
    } else {
      setAccount(accounts[0]);
      if (contract) {
        await loadUserInfo(contract, accounts[0]);
      }
    }
  };

  const handleLogout = () => {
    // Reset all state
    setAccount('');
    setUserInfo(null);
    setContract(null);
    setProvider(null);
    setSigner(null);
    setRecords([]);
    setAuditLogs([]);
    setActiveTab('home');
    setRegisterForm({ name: '', role: '1' });
    setRecordForm({ ipfsHash: '', recordType: '', description: '' });
    setAccessForm({ doctorAddress: '', duration: '2592000', purpose: '' });
  };

  const loadUserInfo = async (contractInstance, address) => {
    try {
      const info = await contractInstance.getUserInfo(address);
      if (info[2]) { // isRegistered
        setUserInfo({
          name: info[0],
          role: Number(info[1]),
          isRegistered: info[2],
          registrationTime: Number(info[3])
        });

        // Load records based on role
        if (Number(info[1]) === 1) {
          // Patient - load their own records
          await loadRecords(contractInstance, address);
        } else if (Number(info[1]) === 2) {
          // Doctor - load accessible records
          await loadDoctorAccessibleRecords(contractInstance, address);
        }

        // Load audit logs
        await loadAuditLogs(contractInstance, address);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadRecords = async (contractInstance, patientAddress) => {
    try {
      const recordIds = await contractInstance.getPatientRecordIds(patientAddress);
      const recordsData = [];

      for (let id of recordIds) {
        try {
          const record = await contractInstance.getRecord(id);
          recordsData.push({
            id: Number(id),
            patient: record[0],
            ipfsHash: record[1],
            recordType: record[2],
            description: record[3],
            timestamp: Number(record[4])
          });
        } catch (error) {
          console.log('Cannot access record:', id);
        }
      }

      setRecords(recordsData);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const loadDoctorAccessibleRecords = async (contractInstance, doctorAddress) => {
    try {
      const recordIds = await contractInstance.getDoctorAccessibleRecords(doctorAddress);
      const recordsData = [];

      for (let id of recordIds) {
        try {
          const record = await contractInstance.getRecord(id);
          recordsData.push({
            id: Number(id),
            patient: record[0],
            ipfsHash: record[1],
            recordType: record[2],
            description: record[3],
            timestamp: Number(record[4])
          });
        } catch (error) {
          console.log('Cannot access record:', id);
        }
      }

      setRecords(recordsData);
    } catch (error) {
      console.error('Error loading doctor accessible records:', error);
    }
  };

  const loadAuditLogs = async (contractInstance, address) => {
    try {
      const logs = await contractInstance.getAuditTrail(address);
      setAuditLogs(logs.map(log => ({
        accessor: log.accessor,
        recordId: Number(log.recordId),
        timestamp: Number(log.timestamp),
        action: log.action
      })));
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadStats = async (contractInstance) => {
    try {
      const stats = await contractInstance.getStats();
      setStats({
        totalRecords: Number(stats[0]),
        emergencyStatus: stats[1]
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // User Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.registerUser(registerForm.name, registerForm.role);
      await tx.wait();
      
      alert('Registration successful!');
      await loadUserInfo(contract, account);
      setRegisterForm({ name: '', role: '1' });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create Medical Record
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      // Simulate IPFS hash (in production, upload to IPFS first)
      const simulatedHash = `Qm${Math.random().toString(36).substring(7)}`;
      
      const tx = await contract.createRecord(
        recordForm.ipfsHash || simulatedHash,
        recordForm.recordType,
        recordForm.description
      );
      await tx.wait();
      
      alert('Medical record created successfully!');
      await loadRecords(contract, account);
      await loadStats(contract);
      setRecordForm({ ipfsHash: '', recordType: '', description: '' });
    } catch (error) {
      console.error('Create record error:', error);
      alert('Failed to create record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Grant Access
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.grantAccess(
        accessForm.doctorAddress,
        accessForm.duration,
        accessForm.purpose
      );
      await tx.wait();
      
      alert('Access granted successfully!');
      setAccessForm({ doctorAddress: '', duration: '2592000', purpose: '' });
    } catch (error) {
      console.error('Grant access error:', error);
      alert('Failed to grant access: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper Functions
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getRoleName = (role) => {
    const roles = ['None', 'Patient', 'Doctor', 'Admin'];
    return roles[role] || 'Unknown';
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <Activity className="logo-icon" />
              <h1>MedChain</h1>
            </div>
            
            {!account ? (
              <button onClick={connectWallet} className="btn btn-primary" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="user-info-header">
                <div className="account-badge">
                  <Shield size={16} />
                  <span>{formatAddress(account)}</span>
                </div>
                {userInfo && (
                  <div className="role-badge">
                    {getRoleName(userInfo.role)}
                  </div>
                )}
                <button onClick={handleLogout} className="btn btn-secondary" title="Logout and switch accounts">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {!account ? (
            /* Welcome Screen */
            <div className="welcome-screen">
              <div className="welcome-card">
                <Activity className="welcome-icon" />
                <h2>Welcome to MedChain</h2>
                <p>Secure, Decentralized Medical Record Management</p>
                <div className="features-grid">
                  <div className="feature">
                    <Lock className="feature-icon" />
                    <h3>Patient Controlled</h3>
                    <p>You own and control your medical data</p>
                  </div>
                  <div className="feature">
                    <Database className="feature-icon" />
                    <h3>Blockchain Secured</h3>
                    <p>Immutable and transparent record keeping</p>
                  </div>
                  <div className="feature">
                    <Users className="feature-icon" />
                    <h3>Selective Sharing</h3>
                    <p>Grant temporary access to healthcare providers</p>
                  </div>
                  <div className="feature">
                    <FileText className="feature-icon" />
                    <h3>Complete Audit Trail</h3>
                    <p>Track every access to your records</p>
                  </div>
                </div>
                <button onClick={connectWallet} className="btn btn-large btn-primary">
                  Get Started
                </button>
              </div>
            </div>
          ) : !userInfo?.isRegistered ? (
            /* Registration Form */
            <div className="registration-screen">
              <div className="reg-card">
                <UserPlus className="reg-icon" />
                <h2>Register Your Account</h2>
                <p>Choose your role to get started</p>
                
                <form onSubmit={handleRegister} className="reg-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={registerForm.role}
                      onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                    >
                      <option value="1">Patient</option>
                      <option value="2">Doctor</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Dashboard */
            <div className="dashboard">
              {/* Stats Bar */}
              <div className="stats-bar">
                <div className="stat-card">
                  <FileText className="stat-icon" />
                  <div>
                    <div className="stat-value">{stats.totalRecords}</div>
                    <div className="stat-label">Total Records</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Users className="stat-icon" />
                  <div>
                    <div className="stat-value">{records.length}</div>
                    <div className="stat-label">My Records</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Activity className="stat-icon" />
                  <div>
                    <div className="stat-value">{auditLogs.length}</div>
                    <div className="stat-label">Audit Logs</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  <FileText size={18} />
                  Records
                </button>
                {userInfo.role === 1 && (
                  <>
                    <button 
                      className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                      onClick={() => setActiveTab('create')}
                    >
                      <Upload size={18} />
                      New Record
                    </button>
                    <button 
                      className={`tab ${activeTab === 'access' ? 'active' : ''}`}
                      onClick={() => setActiveTab('access')}
                    >
                      <Key size={18} />
                      Manage Access
                    </button>
                  </>
                )}
                <button 
                  className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('audit')}
                >
                  <Clock size={18} />
                  Audit Trail
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'home' && (
                  <div className="records-list">
                    <h2>Medical Records</h2>
                    {records.length === 0 ? (
                      <div className="empty-state">
                        <FileText size={48} />
                        <p>{userInfo.role === 1 ? 'No medical records yet' : 'No accessible records'}</p>
                      </div>
                    ) : (
                      <div className="records-grid">
                        {records.map((record) => (
                          <div key={record.id} className="record-card">
                            <div className="record-header">
                              <Stethoscope className="record-icon" />
                              <span className="record-type">{record.recordType}</span>
                            </div>
                            <h3>{record.description}</h3>
                            {userInfo.role === 2 && (
                              <div className="record-patient">
                                <Users size={14} />
                                <span>Patient: {formatAddress(record.patient)}</span>
                              </div>
                            )}
                            <div className="record-meta">
                              <div className="meta-item">
                                <Clock size={14} />
                                {formatDate(record.timestamp)}
                              </div>
                              <div className="meta-item">
                                <Database size={14} />
                                {formatAddress(record.ipfsHash)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'create' && userInfo.role === 1 && (
                  <div className="create-record">
                    <h2>Create Medical Record</h2>
                    <form onSubmit={handleCreateRecord} className="form">
                      <div className="form-group">
                        <label>Record Type</label>
                        <select
                          value={recordForm.recordType}
                          onChange={(e) => setRecordForm({...recordForm, recordType: e.target.value})}
                          required
                        >
                          <option value="">Select type...</option>
                          <option value="Lab Report">Lab Report</option>
                          <option value="X-Ray">X-Ray</option>
                          <option value="Prescription">Prescription</option>
                          <option value="Diagnosis">Diagnosis</option>
                          <option value="Surgery Report">Surgery Report</option>
                          <option value="Vaccination">Vaccination</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={recordForm.description}
                          onChange={(e) => setRecordForm({...recordForm, description: e.target.value})}
                          placeholder="Brief description of the medical record"
                          rows="3"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>IPFS Hash (Optional)</label>
                        <input
                          type="text"
                          value={recordForm.ipfsHash}
                          onChange={(e) => setRecordForm({...recordForm, ipfsHash: e.target.value})}
                          placeholder="Leave empty to auto-generate"
                        />
                        <small>In production, upload file to IPFS first</small>
                      </div>
                      
                      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Record'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'access' && userInfo.role === 1 && (
                  <div className="access-management">
                    <h2>Grant Access to Doctor</h2>
                    <form onSubmit={handleGrantAccess} className="form">
                      <div className="form-group">
                        <label>Doctor's Wallet Address</label>
                        <input
                          type="text"
                          value={accessForm.doctorAddress}
                          onChange={(e) => setAccessForm({...accessForm, doctorAddress: e.target.value})}
                          placeholder="0x..."
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Access Duration</label>
                        <select
                          value={accessForm.duration}
                          onChange={(e) => setAccessForm({...accessForm, duration: e.target.value})}
                        >
                          <option value="86400">1 Day</option>
                          <option value="604800">1 Week</option>
                          <option value="2592000">1 Month</option>
                          <option value="7776000">3 Months</option>
                          <option value="0">No Expiry</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Purpose</label>
                        <input
                          type="text"
                          value={accessForm.purpose}
                          onChange={(e) => setAccessForm({...accessForm, purpose: e.target.value})}
                          placeholder="e.g., Routine checkup, Surgery consultation"
                          required
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Granting...' : 'Grant Access'}
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="audit-trail">
                    <h2>Audit Trail</h2>
                    {auditLogs.length === 0 ? (
                      <div className="empty-state">
                        <Clock size={48} />
                        <p>No audit logs yet</p>
                      </div>
                    ) : (
                      <div className="audit-list">
                        {auditLogs.map((log, index) => (
                          <div key={index} className="audit-item">
                            <div className="audit-icon">
                              {log.action === 'CREATE' && <Upload size={20} />}
                              {log.action === 'VIEW' && <FileText size={20} />}
                              {log.action === 'GRANT_ACCESS' && <Unlock size={20} />}
                              {log.action === 'REVOKE_ACCESS' && <Lock size={20} />}
                            </div>
                            <div className="audit-details">
                              <div className="audit-action">{log.action}</div>
                              <div className="audit-meta">
                                {formatDate(log.timestamp)} • Record #{log.recordId || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>MedChain • Secure Medical Records on Blockchain</p>
          <p>Built with Ethereum & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;