# MedChain - Blockchain-Based Medical Record Sharing System

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.19-blue" alt="Solidity Version">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB" alt="React Version">
  <img src="https://img.shields.io/badge/Ethereum-Sepolia-yellow" alt="Ethereum Network">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

## 📽️ Demo Video

Watch the complete demo of MedChain: **[MedChain Demo Video](https://youtu.be/4Dyiui1YQAA)**

---

## 🌟 Overview

MedChain is an advanced **blockchain-based medical record management system** that enables patients to securely store, manage, and share their medical records with healthcare providers. Built on Ethereum blockchain, it provides patient-controlled access with time-based permissions and comprehensive audit trails.

## ✨ Key Features

### 🔐 Patient-Controlled Access
- Patients have full control over who can access their medical records
- Grant and revoke access to doctors at any time
- Set time-based access permissions with automatic expiration

### 📋 Comprehensive Audit Trail
- All record access is logged on the blockchain
- Complete history of who accessed what records and when
- Transparent and immutable audit logs

### ⏱️ Time-Based Permissions
- Set access duration for medical records
- Automatic access revocation after expiration
- Option for permanent access when needed

### 🚨 Emergency Access Mode
- Admin can enable emergency mode for critical situations
- Allows all registered doctors to access patient records during emergencies
- Toggle on/off by admin only

### 👨‍⚕️ Role-Based System
- **Patients**: Register, create records, manage access
- **Doctors**: View authorized records, access patient data
- **Admin**: System management, emergency mode control

### 🔒 Secure Record Storage
- Medical records stored with IPFS hash references
- Only authorized parties can view record details
- Encryption-ready architecture

## 🛠️ Technology Stack

### Smart Contract
- **Solidity**: 0.8.19
- **Ethereum**: Sepolia Testnet
- **Hardhat**: Development Framework
- **TypeChain**: TypeScript bindings

### Frontend
- **React**: 19.x
- **Vite**: Build tool
- **Ethers.js**: Blockchain interaction
- **Tailwind CSS**: Styling
- **Lucide React**: Icons

## 📁 Project Structure

```
Blockchain-Project-MedChain/
├── blockchain/                  # Smart Contract Project
│   ├── contracts/
│   │   └── MedChain.sol        # Main smart contract
│   ├── scripts/
│   │   └── deploy.js           # Deployment script
│   ├── hardhat.config.ts       # Hardhat configuration
│   ├── package.json
│   └── typechain-types/        # Generated TypeScript types
│
└── frontend/                   # React Frontend
    ├── src/
    │   ├── App.jsx             # Main application component
    │   ├── config.js           # Contract configuration
    │   ├── main.jsx            # Entry point
    │   └── index.css           # Global styles
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask wallet
- Alchemy account (for Sepolia testnet)

### Installation

1. **Clone the repository**

```
bash
git clone <repository-url>
cd Blockchain-Project-MedChain
```

2. **Set up the blockchain project**

```
bash
cd blockchain
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `blockchain` directory:

```
env
ALCHEMY_API_URL=your_alchemy_sepolia_url
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

4. **Deploy the smart contract**

```
bash
npx hardhat run scripts/deploy.js --network sepolia
```

5. **Update frontend configuration**

Copy the deployed contract address and update `frontend/src/config.js`:

```
javascript
export const CONTRACT_ADDRESS = "your_deployed_contract_address";
```

6. **Set up the frontend**

```
bash
cd frontend
npm install
```

7. **Run the frontend**

```
bash
npm run dev
```

8. **Access the application**

Open your browser and navigate to `http://localhost:5173`

## 📖 Smart Contract Functions

### User Management

| Function | Description |
|----------|-------------|
| `registerUser(string _name, UserRole _role)` | Register as Patient (1) or Doctor (2) |
| `getUserInfo(address _userAddress)` | Get user details |

### Medical Records

| Function | Description |
|----------|-------------|
| `createRecord(string _ipfsHash, string _recordType, string _description)` | Create new medical record |
| `getRecord(uint256 _recordId)` | Get record details (authorized only) |
| `getPatientRecordIds(address _patient)` | Get all record IDs for a patient |
| `getDoctorAccessibleRecords(address _doctor)` | Get records accessible to a doctor |

### Access Control

| Function | Description |
|----------|-------------|
| `grantAccess(address _doctor, uint256 _expiryDuration, string _purpose)` | Grant doctor access to records |
| `revokeAccess(address _doctor)` | Revoke doctor's access |
| `checkAccess(address _patient, address _doctor)` | Check if doctor has access |

### Audit & Admin

| Function | Description |
|----------|-------------|
| `getAuditTrail(address _user)` | Get audit trail for a user |
| `toggleEmergencyMode()` | Toggle emergency access mode |
| `getStats()` | Get contract statistics |

## 🔧 Configuration

### MetaMask Setup

1. Install MetaMask browser extension
2. Create or import a wallet
3. Add Sepolia test network:
   - Network Name: Sepolia
   - RPC URL: Your Alchemy Sepolia URL
   - Chain ID: 11155111
   - Currency Symbol: ETH
4. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

## 📱 User Guide

### For Patients

1. Connect wallet and register as "Patient"
2. Create medical records with IPFS hash
3. Grant access to doctors with expiration time
4. View and manage who has access to your records
5. Revoke access at any time

### For Doctors

1. Connect wallet and register as "Doctor"
2. View records that patients have shared with you
3. Access patient data only when authorized

### For Admins

1. Monitor system usage via contract statistics
2. Toggle emergency mode when necessary

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<p align="center">
  Built with ❤️ using Solidity, React, and Ethereum
</p>
