
import api from './api';

export const productService = {

    // Get all products
    async listProducts() {
        const response = await api.get('/products');
        return response.data;
    },

    // Get product by ID
    async getProduct(id) {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    // Create product
    async createProduct(data) {
        const response = await api.post('/products', data);
        return response.data;
    },

    // Update product
    async updateProduct(id, data) {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    // Delete product
    async deleteProduct(id) {
        await api.delete(`/products/${id}`);
    },

    // Generate AI product catalog using description and optional image
    async generateCatalog(description, image) {
        const formData = new FormData();

        formData.append('description', description);

        if (image) {
            formData.append('image', image);
        }

        const response = await api.post(
            '/products/generate-catalog',
            formData
        );

        return response.data;
    },

    // Upload product image (existing feature)
    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/products/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Get image analysis
    async getImageAnalysis(docId) {
        const response = await api.get(
            `/products/image/${docId}/analysis`
        );

        return response.data;
    },
};

export default productService;
