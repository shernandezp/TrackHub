/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import { styled } from '@mui/system';

const RefreshLabelStyle = styled('div')({
  position: 'relative',
  '& .label': {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'white',
    padding: '5px 8px',
    borderRadius: '15px',
    border: '1px solid #ccc',
    zIndex: 1000
  },
});

export default RefreshLabelStyle;