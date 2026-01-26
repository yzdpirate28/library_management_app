// Récupérer le token
export const getToken = () => localStorage.getItem('token');

// Récupérer l'utilisateur
export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
    return !!getToken();
};

// Vérifier si l'utilisateur est admin
export const isAdmin = () => {
    const user = getUser();
    return user?.role === 'ADMIN';
};

// Sauvegarder les informations d'authentification
export const setAuth = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
};

// Déconnexion
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};