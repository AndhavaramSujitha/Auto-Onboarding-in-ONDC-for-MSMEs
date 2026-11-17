import api from './api';
export const businessService = {
    async getMyBusiness() {
        const response = await api.get('/businesses/me');
        return response.data;
    },
    async createBusiness(data) {
        const response = await api.post('/businesses', data);
        return response.data;
    },
    async updateBusiness(data) {
        const response = await api.put('/businesses/me', data);
        return response.data;
    },
};
export default businessService;
