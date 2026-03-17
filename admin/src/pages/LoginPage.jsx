import { useState } from 'react';
import useAuthStore from '../store/authStore.js';
import * as authApi from '../api/authApi.js';

export default function LoginPage() {
    const login = useAuthStore(s => s.login);

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState(null);
    const [loading,  setLoading]  = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { accessToken, role } = await authApi.login(email, password);
            if (role !== 'admin') {
                setError('Доступ только для администраторов.');
                setLoading(false);
                return;
            }
            login(accessToken, role);
        } catch (err) {
            setError(err.message ?? 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <form className="login-form" onSubmit={handleSubmit}>
                <h1 className="login-form__title">MyCityQuest Admin</h1>

                {error && <div className="login-form__error">{error}</div>}

                <label className="login-form__label">
                    Email
                    <input
                        className="login-form__input"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </label>

                <label className="login-form__label">
                    Пароль
                    <input
                        className="login-form__input"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </label>

                <button
                    className="login-form__submit"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Вход…' : 'Войти'}
                </button>
            </form>
        </div>
    );
}
