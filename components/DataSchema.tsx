import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { useRouter } from 'next/router';

import {
    DataSchemaData,
    getDataSchemaValidValues,
    getDataType,
    getDataSchema,
    SchemaDataId,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import Link from 'next/link';
import {
    EnhancedDataTable,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import { findConditionalAttributes } from '@htan/data-portal-schema';
import TruncatedValuesList from './TruncatedValuesList';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: { [id: string]: DataSchemaData };
}

interface ManifestTabProps {
    schemaData: DataSchemaData;
    requiredDependencies: DataSchemaData[];
    schemaDataById: { [id: string]: DataSchemaData };
}

const LABEL_OVERRIDES: { [text: string]: string } = {
    BulkWESLevel1: 'BulkDNALevel1',
    BulkWESLevel2: 'BulkDNALevel2',
    BulkWESLevel3: 'BulkDNALevel3',
    ImagingLevel3Segmentation: 'ImagingLevel3',
};

const ATTRIBUTE_OVERRIDES: { [text: string]: string } = {
    'Bulk WES Level 1': 'Bulk DNA Level 1',
    'Bulk WES Level 2': 'Bulk DNA Level 2',
    'Bulk WES Level 3': 'Bulk DNA Level 3',
    'Imaging Level 3 Segmentation': 'Imaging Level 3',
};

enum ColumnName {
    Manifest = 'Manifest',
    Attribute = 'Attribute',
    Label = 'Label',
    Description = 'Description',
    Required = 'Required',
    ConditionalIf = 'Conditional If',
    DataType = 'Data Type',
    ValidValues = 'Valid Values',
    ManifestName = 'Manifest Name',
}

enum ColumnSelector {
    Manifest = 'attribute',
    Label = 'label',
    Description = 'description',
    Required = 'required',
    ConditionalIf = 'conditionalIf',
    DataType = 'dataType',
    ValidValues = 'validValues',
}

function getColumnDef(
    dataSchemaMap?: { [id: string]: DataSchemaData },
    isAttributeView: boolean = false,
    currentUrl: string = '',
    onManifestClick?: (manifestName: string) => void
): { [name in ColumnName]: IDataTableColumn } {
    const columnDef: {
        [name in ColumnName]: IEnhancedDataTableColumn<DataSchemaData>;
    } = {
        [ColumnName.Manifest]: {
            name: (
                <Tooltip
                    overlay={`This is the ${
                        isAttributeView ? 'attribute' : 'manifest'
                    } column`}
                    placement="top"
                >
                    <span>
                        {isAttributeView
                            ? ColumnName.Attribute
                            : ColumnName.Manifest}
                    </span>
                </Tooltip>
            ),
            selector: ColumnSelector.Manifest,
            cell: (schemaData: DataSchemaData) => (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onManifestClick && onManifestClick(schemaData.label);
                    }}
                >
                    {ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                        schemaData.attribute}
                </a>
            ),
            wrap: true,
            sortable: true,
        },
        [ColumnName.Attribute]: {
            name: (
                <Tooltip
                    overlay={`This is the ${
                        isAttributeView ? 'attribute' : 'manifest'
                    } column`}
                    placement="top"
                >
                    <span>
                        {isAttributeView
                            ? ColumnName.Attribute
                            : ColumnName.Manifest}
                    </span>
                </Tooltip>
            ),
            selector: ColumnSelector.Manifest,
            cell: (schemaData: DataSchemaData) => (
                <Link
                    href={
                        isAttributeView
                            ? '#'
                            : `/standard/${schemaData.label}?view=attribute`
                    }
                >
                    <a>
                        {ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                            schemaData.attribute}
                    </a>
                </Link>
            ),
            wrap: true,
            sortable: true,
        },
        [ColumnName.Label]: {
            name: (
                <Tooltip overlay="This is the label column" placement="top">
                    <span>{ColumnName.Label}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Label,
            format: (schemaData: DataSchemaData) =>
                LABEL_OVERRIDES[schemaData.label] || schemaData.label,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Description]: {
            name: (
                <Tooltip
                    overlay="This is the description column"
                    placement="top"
                >
                    <span>{ColumnName.Description}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Description,
            grow: 2,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Required]: {
            name: (
                <Tooltip overlay="This is the required column" placement="top">
                    <span>{ColumnName.Required}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Required,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) =>
                schemaData.required ? 'True' : 'False',
        },
        [ColumnName.ManifestName]: {
            name: (
                <Tooltip
                    overlay="This is the manifest name column"
                    placement="top"
                >
                    <span>{ColumnName.ManifestName}</span>
                </Tooltip>
            ),
            selector: 'manifestName',
            wrap: true,
            sortable: true,
        },
        [ColumnName.ConditionalIf]: {
            name: (
                <Tooltip
                    overlay="This attribute becomes mandatory if you have submitted data for any attributes listed within the column"
                    placement="top"
                >
                    <span>{ColumnName.ConditionalIf}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.ConditionalIf,
            cell: (schemaData: DataSchemaData) => {
                const conditionalAttributes = dataSchemaMap
                    ? findConditionalAttributes(schemaData, dataSchemaMap)
                    : [];

                return (
                    <TruncatedValuesList
                        attribute={schemaData.attribute}
                        attributes={conditionalAttributes}
                        modalTitle="valid values"
                        countLabel="Number of valid options"
                    />
                );
            },
            wrap: true,
            minWidth: '250px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) => {
                const conditionalAttributes = dataSchemaMap
                    ? findConditionalAttributes(schemaData, dataSchemaMap)
                    : [];
                return conditionalAttributes.join(' ');
            },
        },
        [ColumnName.DataType]: {
            name: (
                <Tooltip overlay="This is the data type column" placement="top">
                    <span>{ColumnName.DataType}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.DataType,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) => getDataType(schemaData),
        },
        [ColumnName.ValidValues]: {
            name: (
                <Tooltip
                    overlay="This is the valid values column"
                    placement="top"
                >
                    <span>{ColumnName.ValidValues}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.ValidValues,
            cell: (schemaData: DataSchemaData) => {
                const attributes = getDataSchemaValidValues(
                    schemaData,
                    dataSchemaMap
                ).map((s) => s.attribute);
                return (
                    <TruncatedValuesList
                        attribute={schemaData.attribute}
                        attributes={attributes}
                        modalTitle="valid values"
                        countLabel="Number of valid options"
                    />
                );
            },
            wrap: true,
            minWidth: '300px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) => {
                const attributes = getDataSchemaValidValues(
                    schemaData,
                    dataSchemaMap
                ).map((s) => s.attribute);
                return attributes.join(' ');
            },
        },
    };

    return columnDef;
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    isAttributeView?: boolean;
    onManifestClick?: (manifestName: string) => void;
}> = observer((props) => {
    const { isAttributeView = false } = props;
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    const availableColumns = props.columns || [
        isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
        ColumnName.Description,
        ColumnName.Required,
        ColumnName.ConditionalIf,
        ColumnName.DataType,
        ColumnName.ValidValues,
    ];

    const columnDef = getColumnDef(
        props.dataSchemaMap,
        isAttributeView,
        currentUrl,
        props.onManifestClick
    );
    const columns: IDataTableColumn[] = _.uniq(availableColumns).map((name) => {
        if (name === ColumnName.Manifest || name === ColumnName.Attribute) {
            return columnDef[
                isAttributeView ? ColumnName.Attribute : ColumnName.Manifest
            ];
        }
        return columnDef[name];
    });

    return (
        <EnhancedDataTable
            columns={columns}
            data={props.schemaData}
            striped={true}
            dense={false}
            pagination={false}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            downloadButtonLabel="Download Data Summary"
            showColumnSelect={false}
        />
    );
});

function getAllAttributes(
    schemaData: DataSchemaData[],
    dataSchemaMap: { [id: string]: DataSchemaData }
): (DataSchemaData & { manifestName: string })[] {
    const allAttributes = new Set<DataSchemaData & { manifestName: string }>();

    function addAttributeAndDependencies(
        attribute: DataSchemaData,
        manifestName: string
    ) {
        const attributeWithManifest = { ...attribute, manifestName };
        if (
            !Array.from(allAttributes).some(
                (attr) => attr.attribute === attribute.attribute
            )
        ) {
            allAttributes.add(attributeWithManifest);

            // Add required dependencies
            attribute.requiredDependencies.forEach((depId) => {
                if (dataSchemaMap[depId]) {
                    addAttributeAndDependencies(
                        dataSchemaMap[depId],
                        manifestName
                    );
                }
            });

            // Add conditional dependencies
            attribute.conditionalDependencies.forEach((depId) => {
                if (dataSchemaMap[depId]) {
                    addAttributeAndDependencies(
                        dataSchemaMap[depId],
                        manifestName
                    );
                }
            });

            // Add exclusive conditional dependencies
            attribute.exclusiveConditionalDependencies.forEach((depId) => {
                if (dataSchemaMap[depId]) {
                    addAttributeAndDependencies(
                        dataSchemaMap[depId],
                        manifestName
                    );
                }
            });

            // Add dependencies from validValues
            getDataSchemaValidValues(attribute, dataSchemaMap).forEach((dep) =>
                addAttributeAndDependencies(dep, manifestName)
            );

            // Add conditional attributes
            findConditionalAttributes(attribute, dataSchemaMap).forEach(
                (condAttrId) => {
                    if (dataSchemaMap[condAttrId]) {
                        addAttributeAndDependencies(
                            dataSchemaMap[condAttrId],
                            manifestName
                        );
                    }
                }
            );
        }
    }

    schemaData.forEach((attr) => addAttributeAndDependencies(attr, attr.label));
    console.log(Array.from(allAttributes));

    return Array.from(allAttributes);
}

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const router = useRouter();
        const [activeTab, setActiveTab] = useState('manifest');
        const [allAttributes, setAllAttributes] = useState<DataSchemaData[]>(
            []
        );
        const [openTabs, setOpenTabs] = useState<string[]>([]);
        const [manifestData, setManifestData] = useState<{
            [key: string]: any;
        }>({});
        const isAttributeView = router.query.view === 'attribute';

        useEffect(() => {
            setAllAttributes(
                getAllAttributes(props.schemaData, props.dataSchemaMap)
            );
        }, [props.schemaData, props.dataSchemaMap]);

        const handleTabChange = (tab: string) => {
            setActiveTab(tab);
        };

        const openNewTab = async (manifestName: string) => {
            if (!openTabs.includes(manifestName)) {
                setOpenTabs([...openTabs, manifestName]);

                const fullId = `bts:${manifestName}` as SchemaDataId;
                const { schemaDataById } = await getDataSchema([fullId]);
                const schemaData = schemaDataById[fullId];

                const requiredDependencies = (
                    schemaData.requiredDependencies || []
                ).map((depId: string | { '@id': string }) => {
                    const depSchemaId =
                        typeof depId === 'string' ? depId : depId['@id'];
                    return schemaDataById[depSchemaId];
                });

                setManifestData({
                    ...manifestData,
                    [manifestName]: {
                        schemaData,
                        requiredDependencies,
                        schemaDataById,
                    },
                });
            }
            setActiveTab(manifestName);
        };

        const closeTab = (manifestName: string) => {
            setOpenTabs(openTabs.filter((tab) => tab !== manifestName));
            setActiveTab('manifest');
        };

        const manifestColumns = [
            ColumnName.Manifest,
            ColumnName.Description,
            ColumnName.Required,
            ColumnName.ConditionalIf,
            ColumnName.DataType,
            ColumnName.ValidValues,
        ];

        const allAttributesColumns = [
            ColumnName.Attribute,
            ColumnName.ManifestName,
            ColumnName.Description,
            ColumnName.Required,
            ColumnName.ConditionalIf,
            ColumnName.DataType,
            ColumnName.ValidValues,
        ];

        return (
            <div>
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <a
                            className={`nav-link ${
                                activeTab === 'manifest' ? 'active' : ''
                            }`}
                            onClick={() => handleTabChange('manifest')}
                            role="tab"
                        >
                            Manifest
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${
                                activeTab === 'attributes' ? 'active' : ''
                            }`}
                            onClick={() => handleTabChange('attributes')}
                            role="tab"
                        >
                            All Attributes
                        </a>
                    </li>
                    {openTabs.map((tab) => (
                        <li className="nav-item" key={tab}>
                            <a
                                className={`nav-link ${
                                    activeTab === tab ? 'active' : ''
                                }`}
                                onClick={() => handleTabChange(tab)}
                                role="tab"
                            >
                                {tab}
                                <button
                                    className="close ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab);
                                    }}
                                >
                                    &times;
                                </button>
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="tab-content mt-3">
                    <div
                        className={`tab-pane fade ${
                            activeTab === 'manifest' ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={props.schemaData}
                            dataSchemaMap={props.dataSchemaMap}
                            title="Data Schema:"
                            isAttributeView={isAttributeView}
                            columns={manifestColumns}
                            onManifestClick={openNewTab}
                        />
                    </div>
                    <div
                        className={`tab-pane fade ${
                            activeTab === 'attributes' ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={allAttributes}
                            dataSchemaMap={props.dataSchemaMap}
                            title="All Attributes:"
                            isAttributeView={true}
                            columns={allAttributesColumns}
                        />
                    </div>
                    {openTabs.map((tab) => (
                        <div
                            key={tab}
                            className={`tab-pane fade ${
                                activeTab === tab ? 'show active' : ''
                            }`}
                            role="tabpanel"
                        >
                            {manifestData[tab] && (
                                <ManifestTab
                                    schemaData={manifestData[tab].schemaData}
                                    requiredDependencies={
                                        manifestData[tab].requiredDependencies
                                    }
                                    schemaDataById={
                                        manifestData[tab].schemaDataById
                                    }
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

const ManifestTab: React.FC<ManifestTabProps> = ({
    schemaData,
    requiredDependencies,
    schemaDataById,
}) => {
    return (
        <Container>
            <Row>
                <Col>
                    <h1>{schemaData.attribute} Manifest</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <DataSchemaTable
                        schemaData={requiredDependencies}
                        dataSchemaMap={schemaDataById}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default DataSchema;
