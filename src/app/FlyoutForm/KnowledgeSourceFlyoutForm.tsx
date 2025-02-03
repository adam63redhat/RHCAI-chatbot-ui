import { FlyoutError } from '@app/FlyoutError/FlyoutError';
import { FlyoutFooter } from '@app/FlyoutFooter/FlyoutFooter';
import { FlyoutHeader } from '@app/FlyoutHeader/FlyoutHeader';
import { FlyoutLoading } from '@app/FlyoutLoading/FlyoutLoading';
import { useFlyoutWizard } from '@app/FlyoutWizard/FlyoutWizardContext';
import { knowledgeSourceAPI } from '@app/adapters/APIExporter';
import { ErrorObject, Violation } from '@app/types/ErrorObject';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  MenuToggleElement,
  TextInput
} from '@patternfly/react-core';
import { CreateRetrieverConnectionRequest, ElasticsearchConnection } from '@sdk/model';
import { AxiosError } from 'axios';
import * as React from 'react';

interface KnowledgeSourceFlyoutFormProps {
  header: string;
  hideFlyout: () => void;
}

type validate = 'success' | 'error' | 'default';

export const KnowledgeSourceFlyoutForm: React.FunctionComponent<KnowledgeSourceFlyoutFormProps> = ({ header, hideFlyout }: KnowledgeSourceFlyoutFormProps) => {
  const [isLoading, setIsLoading] = React.useState(true);

  const [validated, setValidated] = React.useState<validate>('default');
  const [error, setError] = React.useState<ErrorObject>();
  const { nextStep, prevStep } = useFlyoutWizard();

  // UI State
  const [isKnowledgeSourceOpen, setIsKnowledgeSourceOpen] = React.useState(false);
  
  // Form Fields
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [embeddingType, setEmbeddingType] = React.useState('nomic');
  const [maxResults, setMaxResults] = React.useState('10');
  const [minScore, setMinScore] = React.useState('0.7');

  // Elasticsearch Specific
  const [index, setIndex] = React.useState('');
  const [host, setHost] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    validateForm();
  }, [name, description, index, host]);

  const validateForm = () => {

    if (name.trim() === '') {
      setValidated('default');
    } else if (description.trim() === '') {
      setValidated('default');
    } else if (index.trim() === '') {
      setValidated('default');
    } else if (host.trim() === '') {
      setValidated('default');
    } else {
      setValidated('success');
    }
  }
  
  const handleNameChange = (_event, name: string) => {
    setName(name);
  };

  const handleDescriptionChange = (_event, description: string) => {
    setDescription(description);

  };

  const handleEmbeddingTypeChange = (_event, embeddingType: string) => {
    setEmbeddingType(embeddingType);
  };

  const handleIndexChange = (_event, index: string) => {
    setIndex(index);
  };

  const handleHostChange = (_event, host: string) => {
    setHost(host);
  };

  const handleUsernameChange = (_event, username: string) => {
    setUsername(username);
  };

  const handlePasswordChange = (_event, password: string) => {
    setPassword(password);
  };

  const handleMaxResultsChange = (_event, maxResults: string) => {
    const parsed = parseInt(maxResults, 10);
    if (isNaN(parsed) || parsed < 1) {
      setValidated('error')
    } else {
      setMaxResults(maxResults);
    }
  };

  const handleMinScoreChange = (_event, minScore: string) => {
    const parsed = parseFloat(minScore);
    if (isNaN(parsed) || parsed < 0 || parsed > 1) {
      setValidated('error')
    } else {
      setMinScore(minScore);
    }
  };

  const createKnowledgeSource = async () => {

    const elasticsearchConnection : ElasticsearchConnection = {
      host: host.trim() === '' ? null : host,
      index: index.trim() === '' ? null : index,
      username: username.trim() === '' ? null : username,
      password: password.trim() === '' ? null : password,
      maxResults: maxResults === '' ? null : parseInt(maxResults, 10),
      minScore: minScore === '' ? null : parseFloat(minScore),
      contentRetrieverType: "elasticsearch"
    }

    const payload : CreateRetrieverConnectionRequest = 
    {
      name: name.trim() === '' ? undefined : name,
      description: description.trim() === '' ? undefined : description,
      baseRetrieverRequest: elasticsearchConnection,
      embeddingType: embeddingType.trim() === '' ? undefined : embeddingType
    }

    try {
      return await knowledgeSourceAPI.createOrUpdateRetrieverConnection(payload);
    } catch (error) {
      console.error('Error creating retriever:', error);  
      const axiosError: AxiosError = error as AxiosError;
      const response = axiosError.response;

      if(response?.status === 400) {
        const data: ErrorObject = response?.data as ErrorObject;
        if ('violations' in data) {
          const violations: Violation[] = data?.violations ?? [];
          setError({ title: 'Error creating retriever', violations: violations});
        } else {
          setError({ title: 'Error creating retriever', body: axiosError?.message });
        }
      } else {
        setError({ title: 'Error creating retriever', body: axiosError?.message });
      }
      
      console.error('Error creating retriever:', error);
    }
  };

  const onClick = async () => {
    setError(undefined);
    const data = await createKnowledgeSource();
    if (data) {
      nextStep();
    }
  };

  const onToggleClick = () => {
    setIsKnowledgeSourceOpen(!isKnowledgeSourceOpen);
  };

  const onKnowledgeSourceSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // eslint-disable-next-line no-console
    console.log('selected', value);
    setIsKnowledgeSourceOpen(false);
  };

  React.useEffect(() => {
    // For now we don't need to do anything on
    setIsLoading(false);
  }, []);

  return isLoading ? (
    <FlyoutLoading />
  ) : (
    <>
      <FlyoutHeader title={header} hideFlyout={hideFlyout} />
      <section className="flyout-form-container" aria-label={name} tabIndex={-1}>
        {error ? (
          <FlyoutError title={error.title} subtitle={error.body} violations={error.violations} onClick={onClick} />
        ) : (
          <Form className="flyout-form">
            <FormGroup label="Knowledge Source Type" fieldId="flyout-form-type">
              {/* FormGroup will need to change when we start supporting other Knowledge Support Types */}
              <Dropdown
                isOpen={isKnowledgeSourceOpen}
                onSelect={onKnowledgeSourceSelect}
                onOpenChange={(isOpen: boolean) => setIsKnowledgeSourceOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isKnowledgeSourceOpen}>
                    Elasticsearch
                  </MenuToggle>
                )}
                ouiaId="BasicDropdown"
                shouldFocusToggleOnSelect
                  >
                <DropdownList>
                    <DropdownItem
                      key="elasticsearch"
                      value="elasticsearch"
                    >
                      Elasticsearch
                    </DropdownItem>
                </DropdownList>
              </Dropdown>
            <FormHelperText>
                <HelperText>
                  <HelperTextItem>Currently only ElasticSearch is supported</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
            <FormGroup label="Name" fieldId="flyout-form-name">
              <TextInput
                type="text"
                id="flyout-form-name"
                name="flyout-form-name"
                value={name}
                onChange={handleNameChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Give the Knowledge Source a recognizable name</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Description" fieldId="flyout-form-description">
              <TextInput
                type="text"
                id="flyout-form-description"
                name="flyout-form-description"
                value={description}
                onChange={handleDescriptionChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>A Description of your Knowledge Source</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Embedding Type" fieldId="flyout-form-embedding-type">
              <TextInput
                type="text"
                id="flyout-form-embedding-type"
                name="flyout-form-embedding-type"
                value={embeddingType}
                onChange={handleEmbeddingTypeChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Embedding Type of the Knowledge Source</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Max Results" fieldId="flyout-max-results">
              <TextInput
                type="number"
                min={1}
                id="flyout-max-results"
                value={maxResults}
                onChange={handleMaxResultsChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>How many top results to retrieve (default 10)</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Min Score" fieldId="flyout-min-score">
              <TextInput
                type="text"
                id="flyout-min-score"
                value={minScore}
                onChange={handleMinScoreChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>A minimum score threshold, e.g. 0.7</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Index" fieldId="flyout-form-index">
              <TextInput
                type="text"
                id="flyout-form-index"
                name="flyout-form-index"
                value={index}
                onChange={handleIndexChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Index of the ElasticSearch Cluster</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Host" fieldId="flyout-form-host">
              <TextInput
                type="text"
                id="flyout-form-host"
                name="flyout-form-host"
                value={host}
                onChange={handleHostChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Host of the ElasticSearch Cluster</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Username" fieldId="flyout-form-username">
              <TextInput
                type="text"
                id="flyout-form-username"
                name="flyout-form-username"
                value={username}
                onChange={handleUsernameChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Username for the ElasticSearch Cluster</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label="Password" fieldId="flyout-form-password">
              <TextInput
                type="password"
                id="flyout-form-password"
                name="flyout-form-password"
                value={password}
                onChange={handlePasswordChange}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>Password for the ElasticSearch Cluster</HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>


          </Form>
        )}
      </section>
      {!error && (
        <FlyoutFooter
          isPrimaryButtonDisabled={validated !== 'success'}
          primaryButton="Create Knowledge Source"
          onPrimaryButtonClick={onClick}
          secondaryButton="Cancel"
          onSecondaryButtonClick={prevStep}
        />
      )}
    </>
  );
};
