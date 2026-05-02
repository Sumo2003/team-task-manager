import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  CheckSquare, Clock, AlertTriangle, FolderKanban,
  ListTodo, Loader2, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const statusColors = {
  'todo': 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  'review': 'bg-yellow-100 text-yellow-700',
  'done': 'bg-green-100 text-green-700',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen p-6">
  
      {/* Greeting Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{" "}
          <span className="text-yellow-300">
            {user?.name?.split(' ')[0]}
          </span> 👋
        </h1>
  
        <p className="text-gray-200 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>
  
      {/* Centered Stats */}
      <div className="flex justify-center mb-12">     
         <div style={{ display: "flex", justifyContent: "center" }}>
  <div style={{ 
    display: "grid", 
    gridTemplateColumns: "repeat(3, 1fr)", 
    gap: "16px", 
    maxWidth: "900px", 
    width: "100%" 
  }}> 
 
        <StatCard icon={FolderKanban} label="Total Projects" value={stats?.projects ?? 0} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={ListTodo} label="Total Tasks" value={stats?.total ?? 0} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label="In Progress" value={stats?.inProgress ?? 0} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard icon={Clock} label="To Do" value={stats?.todo ?? 0} color="text-gray-600" bg="bg-gray-100" />
        <StatCard icon={CheckSquare} label="Completed" value={stats?.done ?? 0} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue ?? 0} color="text-red-600" bg="bg-red-50" />
  
        </div>
      </div>
      </div>
  
      {/* Recent Tasks */}
      <div className="card max-w-4xl mx-auto" style={{ marginTop: "60px" }}>
             <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Tasks
          </h2>
  
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">
            View all projects →
          </Link>
        </div>
  
        {stats?.recentTasks?.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare size={40} className="mx-auto text-gray-300 mb-3" />
  
            <p className="text-gray-500">
              No tasks yet. Create a project to get started!
            </p>
  
            <Link to="/projects" className="btn-primary inline-block mt-4">
              Go to Projects
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats?.recentTasks?.map(task => (
              <div
                key={task._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
  
                    {task.isOverdue && (
                      <span className="badge bg-red-100 text-red-600">
                        Overdue
                      </span>
                    )}
                  </div>
  
                  <p className="text-xs text-gray-400 mt-0.5">
                    {task.project?.name}{" "}
                    {task.assignedTo ? `• ${task.assignedTo.name}` : ""} •{" "}
                    {format(new Date(task.updatedAt), "MMM d")}
                  </p>
                </div>
  
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`badge ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
  
                  <span className={`badge ${statusColors[task.status]}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  
    </div>
  );

}