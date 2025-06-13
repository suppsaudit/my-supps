-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, profile, theme_preference)
  VALUES (
    NEW.id,
    NEW.email,
    '{
      "weight": null,
      "height": null,
      "age": null,
      "gender": null,
      "adhd_tendency": false,
      "conditions": [],
      "goals": []
    }'::jsonb,
    'auto'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();