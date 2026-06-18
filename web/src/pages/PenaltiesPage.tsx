import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, DollarSign, Gift, Receipt, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, Badge, LoadingSpinner, Modal, inputClass, btnPrimary, btnSecondary } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

interface Penalty {
  id: string;
  memberId: string;
  amount: number;
  reason: string;
  weekNumber: number | null;
  year: number | null;
  isMonthly: boolean;
  status: 'OUTSTANDING' | 'SETTLED' | 'WAIVED';
  paidAt: string | null;
  createdAt: string;
}

interface PenaltyWithMember extends Penalty {
  member: {
    fullName: string;
    memberId: string;
  };
}

interface Member {
  id: string;
  fullName: string;
  memberId: string;
}

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'];

export default function PenaltiesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [penalties, setPenalties] = useState<PenaltyWithMember[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('OUTSTANDING'); // Default to showing only outstanding
  const [isMonthlyFilter, setIsMonthlyFilter] = useState<string>('');
  
  // Selected member to view penalties
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberPenalties, setMemberPenalties] = useState<Penalty[]>([]);
  
  // Pay penalty modal - using single state for better synchronization
  const [payPenalty, setPayPenalty] = useState<Penalty | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionReference: '',
    notes: ''
  });
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [paying, setPaying] = useState(false);

  // Waive penalty modal - using single state for better synchronization
  const [waivePenalty, setWaivePenalty] = useState<Penalty | null>(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [waiveError, setWaiveError] = useState('');
  const [waiving, setWaiving] = useState(false);

  // Receipt modal - using single state for better synchronization
  const [receiptData, setReceiptData] = useState<any>(null);

  const loadPenalties = async () => {
    setLoading(true);
    try {
      const [penaltiesRes, membersRes] = await Promise.all([
        api.get('/penalties'),
        api.get('/members', { params: { limit: 200, status: 'APPROVED' } })
      ]);
      const allPenalties = penaltiesRes.data.data || [];
      const allMembers = membersRes.data.data || [];
      
      setPenalties(allPenalties);
      
      // Filter to show only members who have OUTSTANDING penalties (not paid/waived)
      const memberIdsWithOutstandingPenalties = new Set(
        allPenalties
          .filter((p: any) => p.status === 'OUTSTANDING')
          .map((p: any) => p.memberId)
      );
      const membersWithPenalties = allMembers.filter((m: Member) => memberIdsWithOutstandingPenalties.has(m.id));
      
      setMembers(membersWithPenalties);
    } catch (error) {
      console.error('Failed to load penalties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberPenalties = async (memberId: string) => {
    if (!memberId) {
      setMemberPenalties([]);
      return;
    }
    try {
      const { data } = await api.get(`/penalties/member/${memberId}`);
      setMemberPenalties(data.data || []);
    } catch (error) {
      console.error('Failed to load member penalties:', error);
      setMemberPenalties([]);
    }
  };

  useEffect(() => {
    loadPenalties();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadMemberPenalties(selectedMemberId);
    }
  }, [selectedMemberId]);



  const openPayModal = (penalty: Penalty) => {
    if (!penalty) {
      console.error('ERROR: penalty is null or undefined!');
      return;
    }
    
    // Set the penalty (this also controls modal visibility)
    setPayPenalty(penalty);
    
    // Set form data
    setPayForm({
      amount: penalty.amount.toString(),
      paymentMethod: 'CASH',
      transactionReference: '',
      notes: `Payment for Week ${penalty.weekNumber}, ${penalty.year}`
    });
    
    // Clear messages
    setPayError('');
    setPaySuccess('');
  };

  const handlePayPenalty = async () => {
    if (!payPenalty) return;
    
    setPayError('');
    setPaySuccess('');
    
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      setPayError('Please enter a valid amount');
      return;
    }
    
    if (Number(payForm.amount) !== Number(payPenalty.amount)) {
      setPayError(`Amount must equal the penalty amount: ${payPenalty.amount} Birr`);
      return;
    }

    setPaying(true);
    try {
      const response = await api.post('/penalties/pay', {
        penaltyId: payPenalty.id,
        amount: Number(payForm.amount),
        paymentMethod: payForm.paymentMethod,
        transactionReference: payForm.transactionReference || undefined,
        notes: payForm.notes || undefined
      });
      
      setPaySuccess('Penalty payment recorded successfully!');
      setReceiptData(response.data.data);
      
      // Reload data
      await loadPenalties();
      if (selectedMemberId) {
        await loadMemberPenalties(selectedMemberId);
      }
      
      // Close pay modal and show receipt
      setTimeout(() => {
        setPayPenalty(null);
        setReceiptData(response.data.data);
      }, 1500);
    } catch (error: any) {
      setPayError(error.response?.data?.message || 'Failed to pay penalty');
    } finally {
      setPaying(false);
    }
  };

  const openWaiveModal = (penalty: Penalty) => {
    setWaivePenalty(penalty);
    setWaiveReason('');
    setWaiveError('');
  };

  const handleWaivePenalty = async () => {
    if (!waivePenalty) return;
    
    setWaiveError('');
    
    if (!waiveReason.trim()) {
      setWaiveError('Please enter a reason for waiving this penalty');
      return;
    }

    setWaiving(true);
    try {
      await api.patch(`/penalties/${waivePenalty.id}/waive`, {
        reason: waiveReason
      });
      
      // Reload data
      await loadPenalties();
      if (selectedMemberId) {
        await loadMemberPenalties(selectedMemberId);
      }
      
      setWaivePenalty(null);
    } catch (error: any) {
      setWaiveError(error.response?.data?.message || 'Failed to waive penalty');
    } finally {
      setWaiving(false);
    }
  };

  const filtered = penalties.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (isMonthlyFilter === 'true' && !p.isMonthly) return false;
    if (isMonthlyFilter === 'false' && p.isMonthly) return false;
    return true;
  });

  // Apply same filters to member penalties
  const filteredMemberPenalties = memberPenalties.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (isMonthlyFilter === 'true' && !p.isMonthly) return false;
    if (isMonthlyFilter === 'false' && p.isMonthly) return false;
    return true;
  });

  const totalOutstanding = penalties
    .filter(p => p.status === 'OUTSTANDING')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalSettled = penalties
    .filter(p => p.status === 'SETTLED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalWaived = penalties
    .filter(p => p.status === 'WAIVED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const renderPenaltyTable = (penaltiesToShow: (Penalty | PenaltyWithMember)[], showMemberColumn = true) => (
    <table className="w-full">
      <thead className="bg-slate-50">
        <tr>
          {showMemberColumn && (
            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Member</th>
          )}
          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Week/Year</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
          <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
          <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {penaltiesToShow.length === 0 ? (
          <tr>
            <td colSpan={showMemberColumn ? 8 : 7} className="px-5 py-10 text-center text-sm text-slate-400">
              No penalties found
            </td>
          </tr>
        ) : (
          penaltiesToShow.map(penalty => (
            <tr key={penalty.id} className="hover:bg-slate-50">
              {showMemberColumn && 'member' in penalty && (
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-800">{penalty.member.fullName}</p>
                  <p className="text-xs text-slate-400">#{penalty.member.memberId}</p>
                </td>
              )}
              <td className="px-5 py-3">
                {penalty.weekNumber && penalty.year ? (
                  <span className="text-sm text-slate-700">Week {penalty.weekNumber}, {penalty.year}</span>
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </td>
              <td className="px-5 py-3">
                <p className="text-sm text-slate-600 max-w-xs truncate">{penalty.reason}</p>
              </td>
              <td className="px-5 py-3 text-right">
                <span className="text-sm font-semibold text-slate-800">
                  {Number(penalty.amount).toLocaleString()} Birr
                </span>
              </td>
              <td className="px-5 py-3">
                {penalty.isMonthly ? (
                  <Badge variant="warning">Monthly</Badge>
                ) : (
                  <Badge variant="default">Weekly</Badge>
                )}
              </td>
              <td className="px-5 py-3">
                {penalty.status === 'OUTSTANDING' && (
                  <Badge variant="danger">Outstanding</Badge>
                )}
                {penalty.status === 'SETTLED' && (
                  <Badge variant="success">Settled</Badge>
                )}
                {penalty.status === 'WAIVED' && (
                  <Badge variant="default">Waived</Badge>
                )}
                {!penalty.status && penalty.paidAt && (
                  <Badge variant="success">Settled</Badge>
                )}
                {!penalty.status && !penalty.paidAt && (
                  <Badge variant="danger">Outstanding</Badge>
                )}
              </td>
              <td className="px-5 py-3">
                <p className="text-xs text-slate-500">
                  {new Date(penalty.createdAt).toLocaleDateString()}
                </p>
                {penalty.paidAt && (
                  <p className="text-xs text-emerald-600">
                    Paid: {new Date(penalty.paidAt).toLocaleDateString()}
                  </p>
                )}
              </td>
              <td className="px-5 py-3 text-center">
                <div className="flex items-center justify-center gap-2" style={{ position: 'relative', zIndex: 10 }}>
                  {(penalty.status === 'OUTSTANDING' || (!penalty.status && !penalty.paidAt)) && (
                    <>
                      <button
                        onClick={(e) => {
                          try {
                            e.preventDefault();
                            e.stopPropagation();
                            openPayModal(penalty);
                          } catch (error) {
                            console.error('ERROR in button click handler:', error);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                        title="Pay Penalty"
                        type="button"
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      >
                        <DollarSign size={14} />
                        Pay
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openWaiveModal(penalty);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Waive Penalty"
                          type="button"
                          style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        >
                          <Gift size={14} />
                          Waive
                        </button>
                      )}
                    </>
                  )}
                  {(penalty.status === 'SETTLED' || (!penalty.status && penalty.paidAt)) && (
                    <span className="text-xs text-emerald-600 font-medium">✓ Paid</span>
                  )}
                  {penalty.status === 'WAIVED' && (
                    <span className="text-xs text-blue-600 font-medium">✓ Waived</span>
                  )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <div>
      <PageHeader title={t('penalties.title')} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Penalties</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{penalties.length}</p>
                </div>
                <AlertCircle className="text-slate-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {penalties.filter(p => p.status === 'OUTSTANDING').length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalOutstanding.toLocaleString()} Birr
                  </p>
                </div>
                <XCircle className="text-red-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Settled</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {penalties.filter(p => p.status === 'SETTLED').length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalSettled.toLocaleString()} Birr
                  </p>
                </div>
                <CheckCircle2 className="text-emerald-400" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Waived</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {penalties.filter(p => p.status === 'WAIVED').length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {totalWaived.toLocaleString()} Birr
                  </p>
                </div>
                <Gift className="text-blue-400" size={32} />
              </div>
            </div>
          </div>

          {/* Member Selector */}
          <div className="bg-white rounded-xl border p-4 mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              View Penalties for Specific Member:
            </label>
            <select
              className={inputClass}
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
            >
              <option value="">-- Select Member --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} (#{m.memberId})
                </option>
              ))}
            </select>
          </div>

          {/* Member Penalties View */}
          {selectedMemberId && (
            <div className="bg-white rounded-xl border shadow-sm mb-6">
              <div className="px-5 py-4 border-b">
                <h3 className="text-lg font-semibold text-slate-800">
                  {members.find(m => m.id === selectedMemberId)?.fullName}'s Penalties
                </h3>
              </div>
              {renderPenaltyTable(filteredMemberPenalties, false)}
            </div>
          )}

          {/* All Penalties View */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">All Penalties</h3>
              
              {/* Filters */}
              <div className="flex gap-3">
                <select
                  className={`${inputClass} w-40`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="OUTSTANDING">Outstanding</option>
                  <option value="SETTLED">Settled</option>
                  <option value="WAIVED">Waived</option>
                </select>
                
                <select
                  className={`${inputClass} w-40`}
                  value={isMonthlyFilter}
                  onChange={(e) => setIsMonthlyFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="false">Weekly</option>
                  <option value="true">Monthly</option>
                </select>
              </div>
            </div>
            {renderPenaltyTable(filtered, true)}
          </div>
        </>
      )}

      {/* Pay Penalty Modal */}
      <Modal
        open={!!payPenalty}
        onClose={() => setPayPenalty(null)}
        title="Pay Penalty"
      >
        {payPenalty && (
          <div className="space-y-4">
            {payError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {payError}
              </div>
            )}
            {paySuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                {paySuccess}
              </div>
            )}
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-slate-500">Week:</span>{' '}
                <span className="font-semibold">Week {payPenalty.weekNumber}, {payPenalty.year}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Reason:</span>{' '}
                <span className="text-slate-700">{payPenalty.reason}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Penalty Amount:</span>{' '}
                <span className="font-bold text-lg text-slate-800">
                  {Number(payPenalty.amount).toLocaleString()} Birr
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount (must equal penalty amount)
              </label>
              <input
                type="number"
                className={inputClass}
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method
              </label>
              <select
                className={inputClass}
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transaction Reference (optional)
              </label>
              <input
                type="text"
                className={inputClass}
                value={payForm.transactionReference}
                onChange={(e) => setPayForm({ ...payForm, transactionReference: e.target.value })}
                placeholder="Enter transaction reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                className={inputClass}
                rows={3}
                value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="Enter any additional notes"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handlePayPenalty}
                disabled={paying}
                className={btnPrimary}
              >
                {paying ? 'Processing...' : `Pay ${Number(payPenalty.amount).toLocaleString()} Birr`}
              </button>
              <button
                onClick={() => setPayPenalty(null)}
                disabled={paying}
                className={btnSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Waive Penalty Modal */}
      <Modal
        open={!!waivePenalty}
        onClose={() => setWaivePenalty(null)}
        title="Waive Penalty"
      >
        {waivePenalty && (
          <div className="space-y-4">
            {waiveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {waiveError}
              </div>
            )}
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <p className="text-sm">
                <span className="text-slate-500">Week:</span>{' '}
                <span className="font-semibold">Week {waivePenalty.weekNumber}, {waivePenalty.year}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-500">Amount:</span>{' '}
                <span className="font-bold text-lg text-slate-800">
                  {Number(waivePenalty.amount).toLocaleString()} Birr
                </span>
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p className="font-semibold">⚠️ Important:</p>
              <p className="mt-1">Waiving this penalty will:</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Mark it as WAIVED (cannot be undone)</li>
                <li>Reduce member's outstanding balance</li>
                <li>Notify the member</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for Waiving (required)
              </label>
              <textarea
                className={inputClass}
                rows={4}
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                placeholder="Enter reason for waiving this penalty..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleWaivePenalty}
                disabled={waiving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {waiving ? 'Waiving...' : 'Waive Penalty'}
              </button>
              <button
                onClick={() => setWaivePenalty(null)}
                disabled={waiving}
                className={btnSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        open={!!receiptData}
        onClose={() => setReceiptData(null)}
        title="Payment Receipt"
      >
        {receiptData && (
          <div className="space-y-4">
            <div className="text-center">
              <Receipt className="mx-auto text-emerald-600 mb-3" size={48} />
              <h3 className="text-lg font-bold text-slate-800">Payment Successful!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Receipt #{receiptData.payment?.receiptNumber}
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  {Number(receiptData.payment?.amount).toLocaleString()} Birr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium text-slate-800">
                  {receiptData.payment?.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Week:</span>
                <span className="font-medium text-slate-800">
                  Week {receiptData.penalty?.weekNumber}, {receiptData.penalty?.year}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status:</span>
                <Badge variant="success">Settled</Badge>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
              ✓ Penalty has been marked as SETTLED<br />
              ✓ Member's balance has been updated<br />
              ✓ Member has been notified
            </div>

            <button
              onClick={() => setReceiptData(null)}
              className={btnPrimary + ' w-full'}
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
