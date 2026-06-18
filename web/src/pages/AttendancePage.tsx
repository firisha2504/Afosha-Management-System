import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Users, ClipboardList } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Badge, LoadingSpinner, Modal, inputClass, btnPrimary, btnSecondary } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

interface Meeting { id: string; title: string; meetingDate: string; location?: string; agenda?: string; meetingTime?: string; }
interface Member { id: string; fullName: string; memberId: string; }
interface AttendanceRecord { id: string; status: string; remarks?: string; memberId: string; meetingId: string; member: { fullName: string; memberId: string }; meeting: { title: string; meetingDate: string }; }

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'EXCUSED'];

export default function AttendancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Meeting modal
  const [showMeeting, setShowMeeting] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [meetingForm, setMeetingForm] = useState({ title: '', location: '', meetingDate: '', meetingTime: '', agenda: '' });
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Attendance modal
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Edit single attendance record
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'meeting' | 'attendance'; id: string; label: string } | null>(null);

  // Filter by meeting
  const [filterMeeting, setFilterMeeting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [mtg, mem, att] = await Promise.all([
        api.get('/finance/meetings'),
        api.get('/members', { params: { limit: 200, status: 'APPROVED' } }),
        api.get('/finance/attendance/report'),
      ]);
      setMeetings(mtg.data.data || []);
      setMembers(mem.data.data || []);
      setRecords(att.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Pre-fill attendance map when a meeting is selected
  useEffect(() => {
    if (!selectedMeeting) return;
    // Load existing attendance for this meeting
    api.get(`/finance/attendance/meeting/${selectedMeeting}`)
      .then(({ data }) => {
        const existing: Record<string, string> = {};
        (data.data || []).forEach((r: AttendanceRecord) => { existing[r.memberId] = r.status; });
        // Default unset members to PRESENT
        members.forEach((m) => { if (!existing[m.id]) existing[m.id] = 'PRESENT'; });
        setAttendanceMap(existing);
      })
      .catch(() => {
        const def: Record<string, string> = {};
        members.forEach((m) => { def[m.id] = 'PRESENT'; });
        setAttendanceMap(def);
      });
  }, [selectedMeeting, members]);

  // ── Mark all helper ──
  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    members.forEach((m) => { next[m.id] = status; });
    setAttendanceMap(next);
  };

  // ── Create / Edit Meeting ──
  const openNewMeeting = () => {
    setEditMeeting(null);
    setMeetingForm({ title: '', location: '', meetingDate: '', meetingTime: '', agenda: '' });
    setShowMeeting(true);
  };

  const openEditMeeting = (m: Meeting) => {
    setEditMeeting(m);
    setMeetingForm({
      title: m.title,
      location: m.location || '',
      meetingDate: m.meetingDate.slice(0, 10),
      meetingTime: m.meetingTime || '',
      agenda: m.agenda || '',
    });
    setShowMeeting(true);
  };

  const saveMeeting = async () => {
    if (!meetingForm.title || !meetingForm.meetingDate) return;
    setSavingMeeting(true);
    try {
      if (editMeeting) {
        await api.patch(`/finance/meetings/${editMeeting.id}`, meetingForm);
      } else {
        await api.post('/finance/meetings', meetingForm);
      }
      setShowMeeting(false);
      load();
    } finally { setSavingMeeting(false); }
  };

  // ── Save Bulk Attendance ──
  const saveAttendance = async () => {
    if (!selectedMeeting) return;
    setSavingAttendance(true);
    try {
      // Save attendance only
      const attendancePayload = members.map((m) => ({ 
        memberId: m.id, 
        status: attendanceMap[m.id] || 'ABSENT' 
      }));
      await api.post('/finance/attendance', { meetingId: selectedMeeting, records: attendancePayload });
      
      setShowAttendance(false);
      setSelectedMeeting('');
      load();
    } finally {
      setSavingAttendance(false);
    }
  };

  // ── Edit single attendance record ──
  const openEditRecord = (r: AttendanceRecord) => {
    setEditRecord(r);
    setEditStatus(r.status);
    setEditRemarks(r.remarks || '');
  };

  const saveEditRecord = async () => {
    if (!editRecord) return;
    await api.patch(`/finance/attendance/${editRecord.id}`, { status: editStatus, remarks: editRemarks });
    setEditRecord(null);
    load();
  };

  // ── Delete ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'meeting') {
      await api.delete(`/finance/meetings/${deleteTarget.id}`);
    } else {
      await api.delete(`/finance/attendance/${deleteTarget.id}`);
    }
    setDeleteTarget(null);
    load();
  };

  const filteredRecords = filterMeeting
    ? records.filter((r) => r.meetingId === filterMeeting)
    : records;

  const presentCount = filteredRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'ABSENT').length;
  const excusedCount = filteredRecords.filter((r) => r.status === 'EXCUSED').length;

  return (
    <div>
      <PageHeader
        title={t('nav.attendance')}
        action={
          <div className="flex gap-2">
            {isAdmin && (
              <button className={btnPrimary} onClick={openNewMeeting}>
                <Plus size={16} className="inline mr-1" />Meeting
              </button>
            )}
            <button className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700`} onClick={() => { setShowAttendance(true); setSelectedMeeting(''); }}>
              <ClipboardList size={16} className="inline mr-1" />Record Attendance
            </button>
          </div>
        }
      />

      {loading ? <LoadingSpinner /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{meetings.length}</p>
              <p className="text-xs text-slate-500 mt-1">Total Meetings</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
              <p className="text-xs text-slate-500 mt-1">Present</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-slate-500 mt-1">Absent</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{excusedCount}</p>
              <p className="text-xs text-slate-500 mt-1">Excused</p>
            </div>
          </div>

          {/* Meetings list */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {meetings.map((m) => (
              <div key={m.id} className="bg-white border rounded-xl p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm">{m.title}</h3>
                  <p className="text-xs text-slate-500">{new Date(m.meetingDate).toLocaleDateString()}{m.meetingTime ? ` · ${m.meetingTime}` : ''}</p>
                  {m.location && <p className="text-xs text-slate-400">{m.location}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => openEditMeeting(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteTarget({ type: 'meeting', id: m.id, label: m.title })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Attendance records table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <Users size={15} /> Attendance Records
              </h3>
              <select
                className="border rounded-lg px-3 py-1.5 text-xs text-slate-600"
                value={filterMeeting}
                onChange={(e) => setFilterMeeting(e.target.value)}
              >
                <option value="">All meetings</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>{m.title} · {new Date(m.meetingDate).toLocaleDateString()}</option>
                ))}
              </select>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meeting</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No attendance records found.</td></tr>
                ) : filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium">{r.member.fullName}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{r.meeting.title}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{new Date(r.meeting.meetingDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3"><Badge status={r.status} /></td>
                    <td className="px-6 py-3 text-xs text-slate-400">{r.remarks || '—'}</td>
                    <td className="px-6 py-3 flex gap-1">
                      <button onClick={() => openEditRecord(r)} className="px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 hover:bg-slate-50"><Pencil size={11} />Edit</button>
                      {isAdmin && (
                        <button onClick={() => setDeleteTarget({ type: 'attendance', id: r.id, label: `${r.member.fullName} - ${r.meeting.title}` })} className="px-2.5 py-1 rounded-lg border border-red-100 text-red-500 text-xs hover:bg-red-50"><Trash2 size={11} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create / Edit Meeting Modal */}
      <Modal open={showMeeting} onClose={() => setShowMeeting(false)} title={editMeeting ? 'Edit Meeting' : 'Schedule Meeting'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title *</label>
            <input className={inputClass} placeholder="Meeting title" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location</label>
            <input className={inputClass} placeholder="Location" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date *</label>
              <input className={inputClass} type="date" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Time</label>
              <input className={inputClass} type="time" value={meetingForm.meetingTime} onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Agenda</label>
            <textarea className={inputClass} placeholder="Agenda" rows={3} value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button className={btnPrimary} onClick={saveMeeting} disabled={savingMeeting || !meetingForm.title || !meetingForm.meetingDate}>
              {savingMeeting ? 'Saving...' : editMeeting ? 'Update Meeting' : 'Create Meeting'}
            </button>
            <button className={btnSecondary} onClick={() => setShowMeeting(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Attendance Modal */}
      <Modal open={showAttendance} onClose={() => setShowAttendance(false)} title="Record Attendance" wide>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Meeting *</label>
            <select className={inputClass} value={selectedMeeting} onChange={(e) => setSelectedMeeting(e.target.value)}>
              <option value="">-- Select a meeting --</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>{m.title} — {new Date(m.meetingDate).toLocaleDateString()}</option>
              ))}
            </select>
          </div>

          {selectedMeeting && (
            <>
              {/* Mark all buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Mark all:</span>
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => markAll(s)}
                    className="px-3 py-1 rounded-full text-xs font-medium border hover:opacity-80 transition-opacity"
                    style={{
                      background: s === 'PRESENT' ? '#dcfce7' : s === 'ABSENT' ? '#fee2e2' : '#fef3c7',
                      color: s === 'PRESENT' ? '#16a34a' : s === 'ABSENT' ? '#dc2626' : '#d97706',
                      borderColor: s === 'PRESENT' ? '#bbf7d0' : s === 'ABSENT' ? '#fecaca' : '#fde68a',
                    }}>
                    {s}
                  </button>
                ))}
                <span className="ml-auto text-xs text-slate-400">{members.length} members</span>
              </div>

              {/* Member list with attendance */}
              <div className="max-h-80 overflow-y-auto border rounded-xl divide-y">
                <div className="sticky top-0 bg-slate-100 px-4 py-2 flex items-center text-xs font-semibold text-slate-600 uppercase">
                  <div className="flex-1">Member</div>
                  <div className="w-32">Attendance</div>
                </div>
                {members.map((m, i) => (
                  <div key={m.id} className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-slate-800">{m.fullName}</span>
                      <span className="text-xs text-slate-400 ml-2">#{m.memberId}</span>
                    </div>
                    <select
                      className="w-32 border rounded-lg px-2 py-1 text-xs font-medium"
                      value={attendanceMap[m.id] || 'PRESENT'}
                      style={{
                        color: (attendanceMap[m.id] || 'PRESENT') === 'PRESENT' ? '#16a34a' : (attendanceMap[m.id]) === 'ABSENT' ? '#dc2626' : '#d97706',
                      }}
                      onChange={(e) => setAttendanceMap({ ...attendanceMap, [m.id]: e.target.value })}
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="EXCUSED">Excused</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                <span className="text-emerald-600 font-medium">{Object.values(attendanceMap).filter(v => v === 'PRESENT').length} Present</span>
                <span className="text-red-500 font-medium">{Object.values(attendanceMap).filter(v => v === 'ABSENT').length} Absent</span>
                <span className="text-amber-500 font-medium">{Object.values(attendanceMap).filter(v => v === 'EXCUSED').length} Excused</span>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button className={btnPrimary} onClick={saveAttendance} disabled={!selectedMeeting || savingAttendance}>
              {savingAttendance ? 'Saving...' : `Save Attendance (${members.length} members)`}
            </button>
            <button className={btnSecondary} onClick={() => setShowAttendance(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Edit Single Attendance Modal */}
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="Edit Attendance Record">
        {editRecord && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              <strong>{editRecord.member.fullName}</strong> — {editRecord.meeting.title}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
              <select className={inputClass} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Remarks</label>
              <input className={inputClass} placeholder="Optional remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className={btnPrimary} onClick={saveEditRecord}>Save Changes</button>
              <button className={btnSecondary} onClick={() => setEditRecord(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong>"{deleteTarget.label}"</strong>?
              {deleteTarget.type === 'meeting' && <span className="block text-xs text-red-500 mt-1">This will also delete all attendance records for this meeting.</span>}
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700" onClick={confirmDelete}>Delete</button>
              <button className={btnSecondary} onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
