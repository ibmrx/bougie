-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'documents');

-- Allow public reads
CREATE POLICY "Allow public reads" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'documents');

-- Allow public updates
CREATE POLICY "Allow public updates" ON storage.objects
    FOR UPDATE TO public
    USING (bucket_id = 'documents');

-- Allow public deletes (optional)
CREATE POLICY "Allow public deletes" ON storage.objects
    FOR DELETE TO public
    USING (bucket_id = 'documents');
