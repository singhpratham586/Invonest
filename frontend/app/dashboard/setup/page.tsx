'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  RefreshCw, 
  Check, 
  Plus, 
  Shield, 
  Sliders, 
  DollarSign, 
  Building, 
  Mail, 
  CheckCircle,
  AlertTriangle,
  Link2,
  Trash2,
  Lock,
  MessageSquare
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  lastSync: string;
  logoColor: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'PENDING';
}

export default function SetupPage() {
  // Org profile state
  const [orgName, setOrgName] = useState('Global Solutions');
  const [orgSlug, setOrgSlug] = useState('global-solutions');
  const [billingEmail, setBillingEmail] = useState('billing@globalsolutions.co');
  const [currency, setCurrency] = useState('INR');
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Integrations state
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: '1', name: 'QuickBooks Online', type: 'Accounting Ledger', connected: true, lastSync: '2 hours ago', logoColor: 'bg-green-600' },
    { id: '2', name: 'Stripe Billing', type: 'Payment Processing', connected: true, lastSync: '10 minutes ago', logoColor: 'bg-indigo-600' },
    { id: '3', name: 'Razorpay API', type: 'Payment Gateway', connected: false, lastSync: 'Never', logoColor: 'bg-blue-600' },
    { id: '4', name: 'Zoho Books', type: 'ERP & Billing', connected: false, lastSync: 'Never', logoColor: 'bg-red-500' }
  ]);

  // Sync animation modal state
  const [syncingIntegration, setSyncingIntegration] = useState<Integration | null>(null);
  const [syncStep, setSyncStep] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);

  // Members state
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'Sarah Jenkins', email: 's.jenkins@globalsolutions.co', role: 'ADMIN', status: 'ACTIVE' },
    { id: '2', name: 'Demo User', email: 'demo@invonest.com', role: 'MEMBER', status: 'ACTIVE' },
    { id: '3', name: 'Alex Rivera', email: 'a.rivera@globalsolutions.co', role: 'VIEWER', status: 'PENDING' }
  ]);

  // Invite Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteName, setInviteName] = useState('');

  // Auto reminders active gateways
  const [gateways, setGateways] = useState({
    email: true,
    whatsapp: true,
    sms: false
  });

  // Handle saving organization profile
  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOrg(true);
    setTimeout(() => {
      setIsSavingOrg(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  // Toggle integrations
  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(item => {
      if (item.id === id) {
        return {
          ...item,
          connected: !item.connected,
          lastSync: !item.connected ? 'Just now' : 'Never'
        };
      }
      return item;
    }));
  };

  // Run Manual Ledger Sync
  const runSync = (integration: Integration) => {
    setSyncingIntegration(integration);
    setSyncStep(0);
    setSyncProgress(0);

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSyncingIntegration(null);
            // Update last sync text
            setIntegrations(prevList => prevList.map(item => 
              item.id === integration.id ? { ...item, lastSync: 'Just now' } : item
            ));
          }, 800);
          return 100;
        }
        
        // Progressively advance through 4 visual sync stages
        if (next > 75) setSyncStep(3);
        else if (next > 50) setSyncStep(2);
        else if (next > 25) setSyncStep(1);
        
        return next;
      });
    }, 150);
  };

  // Send invitation
  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'PENDING'
    };

    setMembers([...members, newMember]);
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('MEMBER');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 pb-16">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#0d2227]/10 pb-6">
        <div>
          <h1 className="text-3xl font-normal text-[#0d2227] uppercase font-editorial tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#0d2227]/80" /> Setup & Ledgers
          </h1>
          <p className="text-zinc-500 text-xs mt-1 font-mono">
            Manage organization details, sync core accounts receivable ledgers, and configure team access.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER COLS - CONFIGS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 1: INTEGRATIONS */}
          <section className="glass rounded-2xl p-6 relative overflow-hidden shadow-sm border border-[#0d2227]/10">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#0d2227] uppercase tracking-wider font-mono flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-zinc-500" /> Ledger Integrations
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Link your ERP and payment system billing feeds</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((item) => (
                <div key={item.id} className="bg-white border border-[#0d2227]/10 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${item.logoColor} flex items-center justify-center font-extrabold text-white text-xs`}>
                          {item.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#0d2227]">{item.name}</h4>
                          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">{item.type}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleIntegration(item.id)}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                          item.connected 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {item.connected ? 'CONNECTED' : 'DISCONNECTED'}
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono flex justify-between border-t border-zinc-50 pt-2.5 mt-2">
                      <span>Last sync:</span>
                      <span className="font-bold text-zinc-700">{item.lastSync}</span>
                    </div>
                  </div>

                  {item.connected && (
                    <button 
                      onClick={() => runSync(item)}
                      className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 border border-[#0d2227]/15 rounded-lg text-[10px] font-bold text-[#0d2227] hover:bg-[#abc6d8]/15 active:bg-[#abc6d8]/30 transition-all font-mono"
                    >
                      <RefreshCw className="w-3 h-3" /> Sync Ledger
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: TEAM MEMBERS */}
          <section className="glass rounded-2xl p-6 shadow-sm border border-[#0d2227]/10">
            <div className="flex items-center justify-between mb-5 border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#0d2227] uppercase tracking-wider font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-500" /> Team & Governance
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Manage permissions and delegate ledger operations</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1 bg-[#0d2227] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono hover:bg-[#1a3339] transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Invite User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-zinc-400 font-mono uppercase tracking-wider">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#abc6d8]/40 text-[#0d2227] flex items-center justify-center font-extrabold text-xs">
                            {m.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-[#0d2227]">{m.name}</div>
                            <div className="text-[9px] font-mono text-zinc-400">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-[9px] font-extrabold text-[#0d2227] px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-[9px] font-bold ${
                          m.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-500'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {m.email !== 's.jenkins@globalsolutions.co' ? (
                          <button 
                            onClick={() => removeMember(m.id)}
                            className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <Lock className="w-3 h-3 text-zinc-300 inline mr-2" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN - SIDE CONFIGS */}
        <div className="space-y-8">
          
          {/* ORG PROFILE FORM */}
          <section className="glass rounded-2xl p-6 shadow-sm border border-[#0d2227]/10">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
              <Building className="w-4 h-4 text-zinc-500" />
              <h3 className="font-extrabold text-sm text-[#0d2227] uppercase tracking-wider font-mono">Organization Profile</h3>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-4 text-xs font-semibold text-[#0d2227]/85">
              <div>
                <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0d2227] outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Subdomain Slug</label>
                <div className="flex border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
                  <span className="px-2.5 py-2 text-zinc-400 border-r border-zinc-200 select-none">inv.st/</span>
                  <input 
                    type="text" 
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    className="w-full bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d2227] transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Billing Email</label>
                <input 
                  type="email" 
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0d2227] outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Currency</label>
                  <select 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-2 text-xs outline-none focus:ring-1 focus:ring-[#0d2227] transition-all"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Country</label>
                  <input 
                    type="text" 
                    value="India" 
                    disabled 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-400 select-none cursor-not-allowed"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSavingOrg}
                className="w-full bg-[#0d2227] hover:bg-[#1a3339] text-white py-2 rounded-lg text-xs font-bold transition-all mt-4 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSavingOrg ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                {isSavingOrg ? 'Saving changes...' : 'Save Settings'}
              </button>

              <AnimatePresence>
                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-green-600 text-[10px] text-center font-mono mt-2"
                  >
                    ✔ Organization profile successfully updated!
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </section>

          {/* Dunning / Reminder Channels */}
          <section className="glass rounded-2xl p-6 shadow-sm border border-[#0d2227]/10">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
              <Shield className="w-4 h-4 text-zinc-500" />
              <h3 className="font-extrabold text-sm text-[#0d2227] uppercase tracking-wider font-mono">Dunning Gateways</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white border border-[#0d2227]/5 rounded-xl">
                <div className="flex gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-[#0d2227]">Email Alerts</h4>
                    <p className="text-[9px] text-zinc-400 font-mono">InvoNest SMTP Gateway</p>
                  </div>
                </div>
                <button 
                  onClick={() => setGateways({...gateways, email: !gateways.email})}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                    gateways.email ? 'bg-[#0d2227]' : 'bg-zinc-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    gateways.email ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#0d2227]/5 rounded-xl">
                <div className="flex gap-2.5">
                  <MessageSquare className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-[#0d2227]">WhatsApp Business</h4>
                    <p className="text-[9px] text-zinc-400 font-mono">Meta API Integration</p>
                  </div>
                </div>
                <button 
                  onClick={() => setGateways({...gateways, whatsapp: !gateways.whatsapp})}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                    gateways.whatsapp ? 'bg-[#0d2227]' : 'bg-zinc-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    gateways.whatsapp ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#0d2227]/5 rounded-xl">
                <div className="flex gap-2.5">
                  <Sliders className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-[#0d2227]">SMS Campaigns</h4>
                    <p className="text-[9px] text-zinc-400 font-mono">Twilio Gateway Hub</p>
                  </div>
                </div>
                <button 
                  onClick={() => setGateways({...gateways, sms: !gateways.sms})}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${
                    gateways.sms ? 'bg-[#0d2227]' : 'bg-zinc-200'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${
                    gateways.sms ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </section>

        </div>

      </div>

      {/* SYNC RUNNING PROGRESS MODAL */}
      <AnimatePresence>
        {syncingIntegration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d2227]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-[#0d2227]/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center"
            >
              <RefreshCw className="w-10 h-10 text-[#0d2227] animate-spin mx-auto mb-4" />
              <h3 className="font-bold text-[#0d2227] text-base mb-1">Ledger Synchronization</h3>
              <p className="text-zinc-500 text-xs font-mono mb-6">
                Active connection: {syncingIntegration.name}
              </p>

              {/* Steps logger */}
              <div className="space-y-2.5 text-left mb-6 font-mono text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl p-3.5">
                <div className="flex items-center gap-2">
                  {syncStep >= 0 ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                  <span className={syncStep >= 0 ? 'text-[#0d2227] font-bold' : ''}>Establish API Secure Handshake</span>
                </div>
                <div className="flex items-center gap-2">
                  {syncStep >= 1 ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                  <span className={syncStep >= 1 ? 'text-[#0d2227] font-bold' : ''}>Fetch Outstanding Invoices Ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  {syncStep >= 2 ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                  <span className={syncStep >= 2 ? 'text-[#0d2227] font-bold' : ''}>Process OCR Risk Assessment Signals</span>
                </div>
                <div className="flex items-center gap-2">
                  {syncStep >= 3 ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                  <span className={syncStep >= 3 ? 'text-[#0d2227] font-bold' : ''}>Align Digital Twin Forecast Cache</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden border border-zinc-200">
                <div 
                  className="bg-[#0d2227] h-full rounded-full transition-all duration-150"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono mt-2">
                <span>PROGRESS</span>
                <span className="font-bold">{syncProgress}%</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVITE MEMBER MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0d2227]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-[#0d2227]/10 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h3 className="font-bold text-[#0d2227] text-sm uppercase tracking-wider font-mono">Invite Team Member</h3>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={sendInvite} className="space-y-4 text-xs font-semibold text-[#0d2227]">
                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0d2227] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@globalsolutions.co"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#0d2227] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 font-mono uppercase mb-1">Access Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole('ADMIN')}
                      className={`py-2 px-2 border rounded-lg text-center font-bold font-mono text-[10px] ${
                        inviteRole === 'ADMIN' 
                          ? 'border-[#0d2227] bg-[#0d2227]/5 text-[#0d2227]' 
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'
                      }`}
                    >
                      ADMIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('MEMBER')}
                      className={`py-2 px-2 border rounded-lg text-center font-bold font-mono text-[10px] ${
                        inviteRole === 'MEMBER' 
                          ? 'border-[#0d2227] bg-[#0d2227]/5 text-[#0d2227]' 
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'
                      }`}
                    >
                      MEMBER
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('VIEWER')}
                      className={`py-2 px-2 border rounded-lg text-center font-bold font-mono text-[10px] ${
                        inviteRole === 'VIEWER' 
                          ? 'border-[#0d2227] bg-[#0d2227]/5 text-[#0d2227]' 
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500'
                      }`}
                    >
                      VIEWER
                    </button>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-zinc-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-lg text-xs font-bold text-zinc-500 text-center font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#0d2227] hover:bg-[#1a3339] rounded-lg text-xs font-bold text-white text-center font-mono"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
