// @flow
import * as PAGES from 'constants/pages';
import * as CS from 'constants/claim_search';
import React, { Fragment, PureComponent } from 'react';
import Button from 'component/button';
import path from 'path';
import Card from 'component/common/card';

type Props = {
  uri: string,
  claim: StreamClaim,
  fileInfo: FileListItem,
  metadata: StreamMetadata,
  openFolder: string => void,
  contentType: string,
  user: ?any,
};

class FileDetails extends PureComponent<Props> {
  render() {
    const { uri, claim, contentType, fileInfo, metadata, openFolder } = this.props;

    if (!claim || !metadata) {
      return <span className="empty">{__('Empty claim or metadata info.')}</span>;
    }

    const { languages, license } = metadata;

    const mediaType = contentType || 'unknown';
    const fileSize =
      metadata.source && metadata.source.size
        ? formatBytes(metadata.source.size)
        : fileInfo && fileInfo.download_path && formatBytes(fileInfo.written_bytes);
    let downloadPath = fileInfo && fileInfo.download_path ? path.normalize(fileInfo.download_path) : null;
    let downloadNote;
    // If the path is blank, file is not available. Streamed files won't have any blobs saved
    // Create path from name so the folder opens on click.
    if (fileInfo && fileInfo.blobs_completed >= 1 && fileInfo.download_path === null) {
      downloadPath = `${fileInfo.download_directory}/${fileInfo.file_name}`;
      downloadNote = 'This file may have been streamed, moved or deleted';
    }

    return (
      <Fragment>
        <Card
          title={__('File Details')}
          defaultExpand={false}
          actions={
            <table className="table table--condensed table--fixed table--file-details">
              <tbody>
                <tr>
                  <td> {__('Content Type')}</td>
                  <td>{mediaType}</td>
                </tr>
                {claim && claim.meta.reposted > 0 && (
                  <tr>
                    <td>{__('Reposts')}</td>
                    <td>
                      <Button
                        button="link"
                        label={__('View %count% reposts', { count: claim.meta.reposted })}
                        navigate={`/$/${PAGES.DISCOVER}?${CS.REPOSTED_URI_KEY}=${encodeURIComponent(uri)}`}
                      />
                    </td>
                  </tr>
                )}
                {fileSize && (
                  <tr>
                    <td> {__('File Size')}</td>
                    <td>{fileSize}</td>
                  </tr>
                )}
                <tr>
                  <td> {__('Claim ID')}</td>
                  <td>{claim.claim_id}</td>
                </tr>

                {languages && (
                  <tr>
                    <td>{__('Languages')}</td>
                    <td>{languages.join(' ')}</td>
                  </tr>
                )}
                <tr>
                  <td>{__('License')}</td>
                  <td>{license}</td>
                </tr>
                {downloadPath && (
                  <tr>
                    <td>{__('Downloaded to')}</td>
                    <td>
                      {/* {downloadPath.replace(/(.{10})/g, '$1\u200b')} */}
                      <Button
                        button="link"
                        className="button--download-link"
                        onClick={() => {
                          if (downloadPath) {
                            openFolder(downloadPath);
                          }
                        }}
                        label={downloadNote || downloadPath.replace(/(.{10})/g, '$1\u200b')}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          }
        />
      </Fragment>
    );
  }
}
// move this with other helper functions when we re-use it
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default FileDetails;
