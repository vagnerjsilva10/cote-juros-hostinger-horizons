import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AdminPageHeader from '@/admin/AdminPageHeader.jsx';
import { portalApi } from '@/platform/services/portalApi.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const emptySettings = {
  defaultCtaDestination: '',
  coteFinanceAiBaseUrl: '',
  coteFinanceAiDashboardUrl: '',
  supportEmail: '',
  socialLinks: { linkedin: '', instagram: '', twitter: '', facebook: '' },
  defaultSeo: { titleSuffix: '', defaultDescription: '' },
  analytics: { ga4Key: '', metaPixelKey: '' },
  sourceTagging: { enabled: true, sourceParamName: 'utm_source', mediumParamName: 'utm_medium', campaignParamName: 'utm_campaign' }
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(emptySettings);

  useEffect(() => {
    portalApi.getAdminSettings().then((data) => setSettings({ ...emptySettings, ...data }));
  }, []);

  const update = (path, value) => {
    setSettings((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let pointer = next;
      for (let i = 0; i < keys.length - 1; i += 1) {
        pointer[keys[i]] = { ...pointer[keys[i]] };
        pointer = pointer[keys[i]];
      }
      pointer[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const updated = await portalApi.updateAdminSettings(settings);
    setSettings(updated);
    toast.success('Configurações atualizadas.');
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Platform Settings" description="Configurações globais de destino, SEO e integrações." />

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <form className="space-y-6" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Default CTA destination</Label><Input value={settings.defaultCtaDestination} onChange={(e) => update('defaultCtaDestination', e.target.value)} /></div>
              <div><Label>Support email</Label><Input value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} /></div>
              <div><Label>Cote Finance AI base URL</Label><Input value={settings.coteFinanceAiBaseUrl} onChange={(e) => update('coteFinanceAiBaseUrl', e.target.value)} /></div>
              <div><Label>Cote Finance AI dashboard URL</Label><Input value={settings.coteFinanceAiDashboardUrl} onChange={(e) => update('coteFinanceAiDashboardUrl', e.target.value)} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>LinkedIn</Label><Input value={settings.socialLinks.linkedin} onChange={(e) => update('socialLinks.linkedin', e.target.value)} /></div>
              <div><Label>Instagram</Label><Input value={settings.socialLinks.instagram} onChange={(e) => update('socialLinks.instagram', e.target.value)} /></div>
              <div><Label>Twitter</Label><Input value={settings.socialLinks.twitter} onChange={(e) => update('socialLinks.twitter', e.target.value)} /></div>
              <div><Label>Facebook</Label><Input value={settings.socialLinks.facebook} onChange={(e) => update('socialLinks.facebook', e.target.value)} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>SEO title suffix</Label><Input value={settings.defaultSeo.titleSuffix} onChange={(e) => update('defaultSeo.titleSuffix', e.target.value)} /></div>
              <div><Label>Default SEO description</Label><Input value={settings.defaultSeo.defaultDescription} onChange={(e) => update('defaultSeo.defaultDescription', e.target.value)} /></div>
              <div><Label>GA4 key (placeholder)</Label><Input value={settings.analytics.ga4Key} onChange={(e) => update('analytics.ga4Key', e.target.value)} /></div>
              <div><Label>Meta Pixel key (placeholder)</Label><Input value={settings.analytics.metaPixelKey} onChange={(e) => update('analytics.metaPixelKey', e.target.value)} /></div>
            </div>

            <div className="rounded-md border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="source-tagging-enabled">Source tagging habilitado</Label>
                <Switch id="source-tagging-enabled" checked={Boolean(settings.sourceTagging.enabled)} onCheckedChange={(value) => update('sourceTagging.enabled', value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div><Label>Source param</Label><Input value={settings.sourceTagging.sourceParamName} onChange={(e) => update('sourceTagging.sourceParamName', e.target.value)} /></div>
                <div><Label>Medium param</Label><Input value={settings.sourceTagging.mediumParamName} onChange={(e) => update('sourceTagging.mediumParamName', e.target.value)} /></div>
                <div><Label>Campaign param</Label><Input value={settings.sourceTagging.campaignParamName} onChange={(e) => update('sourceTagging.campaignParamName', e.target.value)} /></div>
              </div>
            </div>

            <Button type="submit">Salvar configurações</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
