import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const { register }                  = useAuth();
  const navigate                      = useNavigate();

  // Keep username always formatted as @xxx
  const handleUsernameChange = (e) => {
    let val = e.target.value;
    // Strip any @ the user might type at start
    if (val.startsWith('@')) val = val.slice(1);
    // Allow only letters, numbers and underscores
    val = val.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('O nome de usuário é obrigatório.'); return; }
    if (!displayName.trim()) { setError('O nome de visualização é obrigatório.'); return; }
    setLoading(true);
    try {
      await register(username, email, password, displayName);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Falha no cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-large">
          <img src="/image/logo.png" alt="Hubify Logo" />
        </div>

        <h2 className="auth-title">Criar Conta</h2>
        <p className="auth-subtitle">Junte-se ao Hubify e comece a colaborar</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="auth-field">
            <label className="auth-label">Nome de visualização</label>
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </span>
              <input
                id="reg-display-name"
                className="auth-input-field"
                type="text"
                placeholder="Ex: André Giordane"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* Username */}
          <div className="auth-field">
            <label className="auth-label">Nome de usuário</label>
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8l4 4-4 4"></path></svg>
              </span>
              <span className="auth-username-prefix">@</span>
              <input
                id="reg-username"
                className="auth-input-field"
                type="text"
                placeholder="seu_usuario"
                value={username}
                onChange={handleUsernameChange}
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </div>
            <span className="auth-hint">Letras, números e _ (sem espaços)</span>
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input
                id="reg-email"
                className="auth-input-field"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Senha</label>
            <div className="auth-input-group">
              <span className="auth-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <input
                id="reg-password"
                className="auth-input-field"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button
            id="reg-submit"
            className="auth-btn-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="auth-link">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
