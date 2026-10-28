import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, Crown } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, LoadingSpinner, inputClass, btnPrimary, Modal } from '../components/ui';
import { CheckCircle, XCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  nameOm?: string;
  role: string;
  roleOm?: string;
  image?: string;
  position: number;
  type: 'member' | 'leader';
}

export default function TeamManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leaders, setLeaders] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'leaders'>('members');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newNameOm, setNewNameOm] = useState('');
  const [newRoleOm, setNewRoleOm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/team');
      const allMembers = data.data || [];
      setMembers(allMembers.filter((m: TeamMember) => m.type === 'member').sort((a: TeamMember, b: TeamMember) => a.position - b.position));
      setLeaders(allMembers.filter((m: TeamMember) => m.type === 'leader').sort((a: TeamMember, b: TeamMember) => a.position - b.position));
    } catch {
      console.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async () => {
    if (!newName.trim() || !newRole.trim()) {
      setModalType('error');
      setModalMessage('Please fill in all required fields');
      setModalOpen(true);
      return;
    }

    setSaving(true);
    try {
      const items = activeTab === 'members' ? members : leaders;
      const newMember: TeamMember = {
        id: `${Date.now()}`,
        name: newName,
        nameOm: newNameOm,
        role: newRole,
        roleOm: newRoleOm,
        position: items.length,
        type: activeTab === 'members' ? 'member' : 'leader',
      };

      if (activeTab === 'members') {
        setMembers([...members, newMember]);
      } else {
        setLeaders([...leaders, newMember]);
      }

      await api.post('/team', { 
        members: [...members, ...(activeTab === 'leaders' ? [newMember] : leaders)] 
      });

      setNewName('');
      setNewRole('');
      setNewNameOm('');
      setNewRoleOm('');
      setModalType('success');
      setModalMessage('Team member added successfully!');
      setModalOpen(true);
    } catch {
      setModalType('error');
      setModalMessage('Failed to add team member');
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id: string) => {
    const newItems = activeTab === 'members' 
      ? members.filter(m => m.id !== id)
      : leaders.filter(l => l.id !== id);

    if (activeTab === 'members') {
      setMembers(newItems);
    } else {
      setLeaders(newItems);
    }

    try {
      await api.post('/team', { members: [...newItems, ...(activeTab === 'members' ? leaders : members)] });
      setModalType('success');
      setModalMessage('Team member removed successfully!');
      setModalOpen(true);
    } catch {
      loadTeam();
      setModalType('error');
      setModalMessage('Failed to remove team member');
      setModalOpen(true);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const allMembers = [...members, ...leaders];
      await api.post('/team', { members: allMembers });
      setModalType('success');
      setModalMessage('Team information saved successfully!');
      setModalOpen(true);
    } catch {
      setModalType('error');
      setModalMessage('Failed to save team information');
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const currentItems = activeTab === 'members' ? members : leaders;

  return (
    <>
      <div className="space-y-6">
        <PageHeader 
          title="Team & Leadership Management" 
          subtitle="Manage team members and leaders for public display"
          action={<button className={btnPrimary} onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save All'}</button>} 
        />

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'members'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={18} />
              Team Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('leaders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'leaders'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Crown size={18} />
              Leaders ({leaders.length})
            </button>
          </div>

          {/* Add New Member Form */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border-2 border-dashed border-gray-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New {activeTab === 'members' ? 'Member' : 'Leader'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (English) *
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role (English) *
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g., Chairperson, Treasurer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Oromiffa)
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={newNameOm}
                  onChange={(e) => setNewNameOm(e.target.value)}
                  placeholder="Enter Oromiffa name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role (Oromiffa)
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={newRoleOm}
                  onChange={(e) => setNewRoleOm(e.target.value)}
                  placeholder="Enter Oromiffa role"
                />
              </div>
            </div>
            <button
              onClick={addTeamMember}
              disabled={saving}
              className={btnPrimary}
            >
              <Plus size={16} className="inline mr-2" />
              Add {activeTab === 'members' ? 'Member' : 'Leader'}
            </button>
          </div>

          {/* Members/Leaders List */}
          <div className="space-y-3">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    {item.nameOm && <p className="text-sm text-gray-600">{item.nameOm}</p>}
                    <p className="text-sm text-gray-600">{item.role}</p>
                    {item.roleOm && <p className="text-sm text-gray-500">{item.roleOm}</p>}
                  </div>
                  <button
                    onClick={() => removeMember(item.id)}
                    className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all border border-red-200"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>No {activeTab === 'members' ? 'members' : 'leaders'} added yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">ℹ️ Information</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li><strong>Members:</strong> General team members displayed on the public home page</li>
            <li><strong>Leaders:</strong> Leadership team (Chairperson, Treasurer, etc.)</li>
            <li><strong>Bilingual Support:</strong> Add content in both English and Oromiffa</li>
            <li><strong>Auto-save:</strong> Click "Save All" to persist changes to the database</li>
            <li><strong>Display:</strong> Members and leaders will appear in a dedicated section on the home page</li>
          </ul>
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalType === 'success' ? 'Success' : 'Error'}>
        <div className="text-center py-4">
          {modalType === 'success' ? (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          )}
          <p className="text-slate-700 text-sm leading-relaxed">{modalMessage}</p>
          <button
            onClick={() => setModalOpen(false)}
            className={`mt-6 ${btnPrimary}`}
          >
            OK
          </button>
        </div>
      </Modal>
    </>
  );
}
