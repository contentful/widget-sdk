import React, { useEffect, useState } from 'react';
import { Heading, Form, SelectField, Option, Button } from '@contentful/forma-36-react-components';
import { AppDefinitionProps } from 'contentful-management/types';
import { getOrgApps } from 'states/deeplink/utils';
import { styles } from './styles';

interface DeeplinkSelectAppProps {
  redirect: { params: { orgId: string } };
  onContinue: (definitionId) => void;
  onCancel: () => void;
}

export default function DeeplinkSelectApp(props: DeeplinkSelectAppProps) {
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const orgId = props.redirect?.params?.orgId;

  useEffect(() => {
    if (orgId) {
      (async () => {
        setLoading(true);
        const apps = await getOrgApps(orgId);
        setApps(apps);
        setLoading(false);
      })();
    }
  }, [orgId]);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <Heading className={styles.title}>Select App</Heading>
        <Form className={styles.form}>
          <SelectField
            selectProps={{
              isDisabled: loading,
              testId: 'deeplink-select-app',
            }}
            labelText="App"
            required
            id="app"
            name="app"
            value={selected}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelected(e.target.value);
            }}>
            <Option value="">Select app</Option>
            {apps.map((app: AppDefinitionProps) => {
              return (
                <Option key={app.sys.id} value={app.sys.id}>
                  {app.name}
                </Option>
              );
            })}
          </SelectField>
        </Form>
      </div>
      <div className={styles.buttonsPanel}>
        <Button
          buttonType="muted"
          className={styles.button}
          onClick={() => {
            props.onCancel();
          }}>
          Cancel
        </Button>
        <Button
          testId="deeplink-proceed"
          disabled={selected === ''}
          buttonType="primary"
          className={styles.button}
          onClick={() => {
            props.onContinue(selected);
          }}>
          Continue
        </Button>
      </div>
    </div>
  );
}
