import api from './api';
export const documentService = {
    async uploadDocument(file, type) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    async getExtraction(docId) {
        const response = await api.get(`/documents/${docId}/extraction`);
        return response.data;
    },
};
export default documentService;
