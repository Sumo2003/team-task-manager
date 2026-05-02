import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, Trash2, UserPlus, X, AlertTriangle, Calendar, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const STATUS_COLUMNS = ['todo', 'in-progress', 'review', 'done'];
const statusLabels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };
const statusColors = { 'todo': 'bg-gray-100 border-gray-200', 'in-progress': 'bg-blue-50 border-blue-200', 'review': 'bg-yellow-50 border-yellow-200', 'done': 'bg-green-50 border-green-200' };
const statusBadge = { 'todo': 'bg-gray-200 text-gray-700', 'in-progress': 'bg-blue-100 text-blue-700', 'review': 'bg-yellow-100 text-yellow-700', 'done': 'bg-green-100 text-green-700' };
const priorityBadge = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600', high: 'bg-orange-100 text-orange-600', urgent: 'bg-red-100 text-red-600' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`)
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const isProjectAdmin = () => {
    if (!project || !user) return false;
    if (isAdmin) return true;
    if (project.owner?._id === user._id) return true;
    const member = project.members?.find(m => m.user?._id === user._id);
    return member?.role === 'admin';
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...taskForm, project: id });
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'todo' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: 'member' });
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success('Member removed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  );

  const tasksByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/projects')}>Projects</span>
            <span>/</span>
            <span className="text-gray-700 font-medium">{project?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          {project?.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {isProjectAdmin() && (
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
              <UserPlus size={16} /> Add Member
            </button>
          )}
          <button onClick={() => setShowTaskModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Team Members</h3>
        <div className="flex flex-wrap gap-2">
          {project?.members?.map(m => (
            <div key={m.user?._id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 group">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {m.user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700">{m.user?.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                {m.role}
              </span>
              {isProjectAdmin() && m.user?._id !== project.owner?._id && (
                <button onClick={() => handleRemoveMember(m.user?._id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all ml-1">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map(status => (
          <div key={status} className={`rounded-xl border-2 ${statusColors[status]} p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{statusLabels[status]}</h3>
              <span className="text-xs bg-white rounded-full w-6 h-6 flex items-center justify-center font-medium text-gray-600 shadow-sm">
                {tasksByStatus[status].length}
              </span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {tasksByStatus[status].map(task => {
                const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
                return (
                  <div key={task._id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 group">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{task.title}</p>
                      {isProjectAdmin() && (
                        <button onClick={() => handleDeleteTask(task._id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 shrink-0 transition-all">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className={`badge ${priorityBadge[task.priority]}`}>
                        <Flag size={10} className="mr-0.5" />{task.priority}
                      </span>
                      {overdue && (
                        <span className="badge bg-red-100 text-red-600">
                          <AlertTriangle size={10} className="mr-0.5" />Overdue
                        </span>
                      )}
                    </div>
                    {task.assignedTo && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white" style={{ fontSize: '8px' }}>
                          {task.assignedTo.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-400">{task.assignedTo.name}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 mb-2 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        <Calendar size={11} />
                        <span className="text-xs">{format(new Date(task.dueDate), 'MMM d')}</span>
                      </div>
                    )}
                    <select
                      value={task.status}
                      onChange={e => handleUpdateStatus(task._id, e.target.value)}
                      className={`w-full text-xs rounded-md px-2 py-1 border-0 font-medium cursor-pointer appearance-none ${statusBadge[task.status]}`}
                    >
                      {STATUS_COLUMNS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Create Task</h2>
              <button onClick={() => setShowTaskModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input resize-none" rows={2} placeholder="Optional description"
                  value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {STATUS_COLUMNS.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select className="input" value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project?.members?.map(m => (
                    <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="input" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Member</h2>
              <button onClick={() => setShowMemberModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Email</label>
                <input type="email" className="input" placeholder="member@example.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required autoFocus />
                <p className="text-xs text-gray-400 mt-1">The user must already have an account</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}