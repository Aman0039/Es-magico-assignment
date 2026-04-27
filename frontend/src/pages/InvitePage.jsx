import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { invitesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { AvatarGroup } from '../components/ui/Avatar';

export const InvitePage = () => {
  const { token } = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }
    invitesAPI.validate(token)
      .then(r => { setProject(r.data.project); setAlreadyMember(r.data.alreadyMember); })
      .catch(err => setError(err.response?.data?.error || 'Invalid or expired invite link'))
      .finally(() => setValidating(false));
  }, [token, isAuthenticated, authLoading]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const r = await invitesAPI.accept(token);
      toast({ type: 'success', title: `Joined ${r.data.project.name}!`, message: 'Welcome to the project.' });
      navigate(`/projects/${r.data.project._id}`);
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.error || 'Failed to join' });
    } finally { setJoining(false); }
  };

  if (authLoading || validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {error ? (
          <div className="cwos-card p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Invalid Invite</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link to="/projects"><Button>Go to Projects</Button></Link>
          </div>
        ) : alreadyMember ? (
          <div className="cwos-card p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Already a Member</h2>
            <p className="text-muted-foreground">You're already part of <strong>{project?.name}</strong>.</p>
            <Link to={`/projects/${project?._id}`}><Button>Go to Project</Button></Link>
          </div>
        ) : project ? (
          <div className="cwos-card p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-4" style={{ background: project.color || '#6366f1' }}>
                {project.name[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-foreground">You're invited to join</h2>
              <p className="text-2xl font-bold text-primary mt-1">{project.name}</p>
              {project.description && <p className="text-muted-foreground mt-2 text-sm">{project.description}</p>}
            </div>

            <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-muted/50">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{(project.members?.length || 0) + 1} current member{(project.members?.length || 0) !== 0 ? 's' : ''}</span>
              <AvatarGroup users={[project.owner, ...(project.members || [])].filter(Boolean)} max={5} />
            </div>

            <div className="flex gap-3">
              <Link to="/projects" className="flex-1">
                <Button variant="outline" className="w-full">Decline</Button>
              </Link>
              <Button className="flex-1" onClick={handleJoin} loading={joining}>
                <CheckCircle className="w-4 h-4" /> Accept Invite
              </Button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
