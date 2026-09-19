import React, { useState, useEffect, createContext } from 'react'; 
import PerfectScrollbar from 'react-perfect-scrollbar';
import {Avatar, Box, Card, Checkbox, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, 
  Typography, makeStyles, Container, CardHeader, CardContent, Divider,MenuItem, Grid, InputLabel, TextField} from '@material-ui/core';
import Page from 'src/components/Page';
import Lottie from 'react-lottie';
import animationData from '../lotties/lock';


const centre = {
  margin: "auto",
  width: "50%",
};

export default function unauthorized(){
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };
return (
  <Page 
      title="Unauthorized"
    >
      <Container maxWidth={false}>
        
        <Box mt={3}>
          <Card>
              <PerfectScrollbar>
                <CardContent style={{marginBottom:"2rem"}}>

                      

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center"
                        }}
                      >
                          Unauthorized!
                       
                          Please Contact System Administrator! 
                      </div>
                      <Lottie 
                        options={defaultOptions}
                          height={400}
                          width={400}
                        />
                </CardContent> 
              </PerfectScrollbar>
            
          </Card>
        </Box>
      </Container>
    </Page>
);
}

