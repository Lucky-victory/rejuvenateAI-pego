'use client';
import React, { RefObject, useRef, useState } from 'react';

import { useRouter } from 'next/router';
import { FieldValues, SubmitErrorHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAppContext } from '@/context/state';
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useAccount,
} from 'wagmi';
import { ethers } from 'ethers';
import {
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  HStack,
  Input,
  Select,
  useToast,
  Text,
} from '@chakra-ui/react';
import { NewUserType, RegisterType } from '../new-user-type';
//import { useAuth } from "near-social-bridge";
import { Swiper, SwiperRef, SwiperSlide } from 'swiper/react';
import SwiperMain from 'swiper';
import Icon from '../Icon';
import NutritionistForm from '../nutritionist-form';
import { countries } from '@/utils/countries';
import { putJSONandGetHash } from '@/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { communityAbi } from '../../../abis';
import { communityAddr } from '@/utils/constants';
import { writeContract, readContract,waitForTransaction } from "@wagmi/core";
const RegisterForm = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  //const auth = useAuth()
  const { address } = useAccount();

  const toast = useToast({
    duration: 3000,
    position: 'top',
    status: 'success',
    title: 'Sign up was successful',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const swiperRef = useRef<SwiperRef>();
  const swiperNestedRef = useRef<SwiperRef>();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [SelectedUserType, setSelectedUserType] =
    useState<RegisterType>('individual');
  const { user, setUser, allTokensData } = useAppContext();
  const [amount, setAmount] = useState('0.01');
  const debouncedAmount = useDebounce<string>(amount, 500);
  const [hasError, setHasError] = useState(false);
  // form validation rules
  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required('Field is required'),
    sex: Yup.string().required('Field is required'),
    country: Yup.string().required('Field is required'),
    weight: Yup.string().required('Field is required'),
    height: Yup.string().required('Field is required'),
    diet: Yup.string().required('Field is required'),
    active: Yup.string().required('Field is required'),
    sitting: Yup.string().required('Field is required'),
    alcohol: Yup.string().required('Field is required'),
    smoke: Yup.string().required('Field is required'),
    sleepLength: Yup.string().required('Field is required'),
    overallHealth: Yup.string().required('Field is required'),
    birthDate: Yup.string().required('Field is required'),
    smokingStopped: Yup.string(),
    smokingLength: Yup.string(),
  });
  const formOptions = { resolver: yupResolver(validationSchema) };
  const { register, handleSubmit, formState, reset } = useForm(formOptions);

  // get functions to build form with useForm() hook
  const { errors, isValid, isSubmitSuccessful } = formState;
  const [cid, setCid] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  
  // const { config } = usePrepareContractWrite({
  //   //@ts-ignore
  //   address: communityAddr,
  //   abi: communityAbi,
  //   functionName: 'registerUser',
  //   args: [cid, allTokensData.userNftUri],
  //   //@ts-ignore
  //   value: ethers.utils.parseEther(debouncedAmount || '0'),
  // });

  // const { write: registerUser, data } = useContractWrite(config);

  // const { isLoading } = useWaitForTransaction({
  //   hash: data?.hash,
  //   onSuccess(tx) {
  //     console.log(tx);
  //     router.push('/member/dashboard');
  //   },
  // });

  
  const registerAccount = async() => {
    const {hash}: any = await writeContract({
      address: communityAddr,
      abi: communityAbi,
      functionName: 'registerUser',
      args: [cid, allTokensData.userNftUri],
      value: ethers.utils.parseEther(debouncedAmount || '0') as unknown as bigint,
    });
    const receipt = await waitForTransaction({ hash });
    if(receipt) {
      fulfillRegistration();
    }
    else{
      toast({
            status: 'error',
            title: 'Registration failed',
          });
    }
    
    // if (!receipt) {
    //   toast({
    //     status: 'error',
    //     title: 'Registration failed',
    //   });
    //   return;
    // }
    return;
  }

  const fulfillRegistration = async() => {
    setIsRegistered(true);
   
    //toast.success("Registration successful!");
    toast({
      status: 'success',
      title: 'Registration successful',
    });
    router.push('/member/dashboard');
  }


  const onInvalidSubmit: SubmitErrorHandler<FieldValues> = (errors: any) => {
    if (!isValid) {
      setHasError(true);
    } else {
      setHasError(false);
    }
  };

  const onValidSubmit = async (data: any) => {
    try {
      if (isSubmitSuccessful) {
        console.log({ data });
      }

      //    const cid = await uploadPromptToIpfs(data);
      if (isValid) {
        setIsSubmitting(true);
        // Serialize the form data into a JSON object
        const formDataObject = {
          fullName: data.fullName,
          sex: data.sex,
          weight: data.weight,
          height: data.height,
          diet: data.diet,
          active: data.active,
          sitting: data.sitting,
          alcohol: data.alcohol,
          smoke: data.smoke,
          sleepLength: data.sleepLength,
          overallHealth: data.overallHealth,
          birthDate: data.birthDate,
          smokingStopped: data.smokingStopped,
          smokingLength: data.smokingLength,
        };

        const cid = await putJSONandGetHash(formDataObject);

        setCid(cid);
        setUser({
          ...user,
          userAddress: address,
          userCidData: cid,
          name: data.fullName,
        });

        //registerUser?.();

        registerAccount();

        toast();
        reset();
        setIsSubmitting(false);
      }
    } catch (error) {
      setIsSubmitting(false);
      toast({
        status: 'error',
        title: 'An error occured, please try again...',
        description: 'Make sure you have a gas fee',
      });
    }
  };
  //   const onInvalidSubmit = (errors:any,event:BaseSyntheticEvent) => {
  // event.preventDefault()
  //     //    const cid = await uploadPromptToIpfs(data);

  //   };
  const dietOptions = [
    'I eat 5 or more servings of vegetables per day',
    'I eat two or more servings of fruit per day',
    'I have two or more servings of dairy (or equivalent) per day',
    'My cereals are mostly whole grains',
    'I eat fast lean protein every day',
    'I eat fast food once per week or less',
    'I eat pastries or cakes once a week or less',
    'I have less than 1 teaspoon of salt per day',
    'I have 2 or less alcoholic drinks on any day',
    'I drink at least 2 litres of water per day',
  ];

  const swiperNestedNext = () => {
    swiperNestedRef.current?.swiper.slideNext();
  };
  const swiperNestedPrev = () => {
    swiperNestedRef.current?.swiper.slidePrev();
  };
  const overallHealthOptions = [
    'Excellent',
    'Very good',
    'Good',
    'Fair',
    'Poor',
  ];
  const smokingOptions = [
    'less than 5 cigarettes',
    '5 to 10 cigarettes',
    '11 to 20 cigarettes',
    'above 20 cigarettes',
  ];
  return (
    <div>
      <Modal
        blockScrollOnMount={false}
        isOpen={isOpen}
        onClose={onClose}
        size={'xl'}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={{ lg: '3xl', base: 'xl' }}>
            <HStack spacing={4} align={'center'}>
              {activeSlideIndex === 1 && (
                <Button
                  variant={'outline'}
                  rounded={'full'}
                  size={'sm'}
                  onClick={() => swiperRef.current?.swiper.slidePrev()}
                >
                  <Icon size={20} name='arrow_back' />
                </Button>
              )}
              <span>Register</span>
            </HStack>
            {hasError && (
              <Text
                color='red.600'
                my={1}
                fontWeight={'medium'}
                fontSize={'md'}
                as={'span'}
              >
                Please fill out all fields
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              as={Swiper}
              onActiveIndexChange={(swiper: SwiperMain) => {
                setActiveSlideIndex(swiper.activeIndex);
              }}
              ref={swiperRef as RefObject<SwiperRef>}
              allowTouchMove={false}
            >
              <SwiperSlide>
                <NewUserType
                  onClick={() => swiperRef.current?.swiper.slideNext()}
                  getValue={setSelectedUserType}
                />
              </SwiperSlide>
              <SwiperSlide>
                {SelectedUserType == 'individual' && (
                  <form onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}>
                    <Swiper
                      nested
                      allowTouchMove={false}
                      ref={swiperNestedRef as RefObject<SwiperRef>}
                    >
                      <SwiperSlide>
                        <Stack spacing={5}>
                          <div>
                            <Input
                              className=' w-full max-w-[100%]'
                              {...register('fullName')}
                              placeholder='Full name'
                            />
                            <div className='text-red-500'>
                              {errors.fullName?.message}
                            </div>
                          </div>
                          <div>
                            <Input
                              type='date'
                              id='start'
                              {...register('birthDate')}
                              className=' w-full max-w-[100%]'
                            />
                            <div className='text-red-500'>
                              {errors.birthDate?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              className='Select w-full max-w-[100%]'
                              {...register('country')}
                              // placeholder="What's your biological sex?"
                              defaultValue=''
                            >
                              <option value='' disabled>
                                Select your country
                              </option>

                              {countries.map((country, i) => (
                                <option
                                  key={'country' + i}
                                  value={country.name}
                                >
                                  {country.name}
                                </option>
                              ))}
                            </Select>
                            <div className='text-red-500'>
                              {errors.country?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              className='Select w-full max-w-[100%]'
                              {...register('sex')}
                              // placeholder="What's your biological sex?"
                              defaultValue=''
                            >
                              <option value='' disabled>
                                What&apos;s your biological sex?
                              </option>
                              <option value='name'>Male</option>
                              <option value='female'>Female</option>
                            </Select>
                            <div className='text-red-500'>
                              {errors.sex?.message}
                            </div>
                          </div>
                        </Stack>

                        <HStack my={6} justify={'flex-end'}>
                          <Button
                            colorScheme='primaryColor'
                            onClick={() => swiperNestedNext()}
                          >
                            Next
                          </Button>
                        </HStack>
                      </SwiperSlide>

                      <SwiperSlide>
                        <Stack spacing={4}>
                          <div>
                            <Input
                              className='Input w-full max-w-[100%]'
                              {...register('weight')}
                              placeholder="What's your weight in kg?"
                            />
                            <div className='text-red-500'>
                              {errors.weight?.message}
                            </div>
                          </div>
                          <div>
                            <Input
                              className='Input w-full max-w-[100%]'
                              {...register('height')}
                              placeholder="What's your height in feet and inches?"
                            />
                            <div className='text-red-500'>
                              {errors.height?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              className='Select w-full max-w-[100%]'
                              {...register('diet')}
                              // placeholder='Tell us about your diet?'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                Tell us about your diet?
                              </option>
                              {dietOptions.map((diet, i) => (
                                <option key={'diet' + i} value={diet}>
                                  {diet}
                                </option>
                              ))}
                            </Select>
                            <div className='text-red-500'>
                              {errors.diet?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              {...register('active')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                How active are you on an average week?
                              </option>
                              <option value='inactive'>inactive</option>
                              <option value='active'>active</option>
                              <option value='very active'>very active</option>
                            </Select>
                            <div className='text-red-500'>
                              {errors.active?.message}
                            </div>
                          </div>
                        </Stack>

                        <HStack gap={4} my={6} justify={'flex-end'}>
                          <Button
                            colorScheme='primaryColor'
                            variant={'outline'}
                            onClick={() => swiperNestedPrev()}
                          >
                            Back
                          </Button>
                          <Button
                            colorScheme='primaryColor'
                            onClick={() => swiperNestedNext()}
                          >
                            Next
                          </Button>
                        </HStack>
                      </SwiperSlide>
                      <SwiperSlide>
                        <Stack spacing={4}>
                          <div>
                            <Select
                              {...register('sitting')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                How many hours a day are you sitting
                              </option>
                              {Array.from({ length: 23 }, (_, i) => (
                                <option value={i + 1} key={'sitting' + i}>
                                  {i + 1}
                                </option>
                              ))}
                            </Select>
                            <div className='text-red-500'>
                              {errors.sitting?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              {...register('alcohol')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                How much alcohol do you drink
                              </option>
                              <option value='0 - 10 drinks a week'>
                                0 - 10 drinks a week
                              </option>
                              <option value='10 - 20 drinks a week'>
                                10 - 20 drinks a week
                              </option>
                              <option value='greater than 20 drinks a week'>
                                greater than 20 drinks a week
                              </option>
                            </Select>
                            <div className='text-red-500'>
                              {errors.alcohol?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              {...register('smoke')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                Do you smoke?
                              </option>
                              <option value='Never smoked'>Never smoked</option>
                              <option value='Ex smoker'>Ex smoker</option>
                              <option value='Current smoker'>
                                Current smoker
                              </option>
                            </Select>
                            <div className='text-red-500'>
                              {errors.smoke?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              {...register('smokingStopped')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                If you are an ex-smoker, how many months ago did
                                you stop?
                              </option>
                              <option value='less than 6 months ago'>
                                less than 6 months ago
                              </option>
                              <option value='six to twelve months ago'>
                                six to twelve months ago
                              </option>
                              <option value='more than twelve months ago'>
                                more than twelve months ago
                              </option>
                            </Select>
                          </div>
                        </Stack>

                        <HStack gap={4} my={6} justify={'flex-end'}>
                          <Button
                            colorScheme='primaryColor'
                            variant={'outline'}
                            onClick={() => swiperNestedPrev()}
                          >
                            Back
                          </Button>
                          <Button
                            colorScheme='primaryColor'
                            onClick={() => swiperNestedNext()}
                          >
                            Next
                          </Button>
                        </HStack>
                      </SwiperSlide>
                      <SwiperSlide>
                        <Stack spacing={4}>
                          <div>
                            <Select
                              {...register('smokingLength')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                If you are a current smoker, how many cigarettes
                                do you smoke per day?
                              </option>
                              {smokingOptions.map((smokingOpt, i) => (
                                <option
                                  key={'smokingOpt' + i}
                                  value={smokingOpt}
                                >
                                  {smokingOpt}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Select
                              {...register('sleepLength')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                How mamy hours of sleep do you get per day?
                              </option>
                              {Array.from({ length: 13 }, (_, item) => (
                                <option
                                  value={item + 1}
                                  key={'sleepLength' + item}
                                >
                                  {item + 1}
                                </option>
                              ))}
                            </Select>
                            <div className='text-red-500'>
                              {errors.sleepLength?.message}
                            </div>
                          </div>
                          <div>
                            <Select
                              {...register('overallHealth')}
                              className='Select w-full max-w-[100%]'
                              defaultValue=''
                            >
                              <option value='' disabled>
                                Rate your overall Health
                              </option>
                              {overallHealthOptions.map((healthOpt, i) => (
                                <option
                                  key={'overallHealth' + i}
                                  value={healthOpt}
                                >
                                  {healthOpt}
                                </option>
                              ))}
                            </Select>
                            <div className='text-red-500'>
                              {errors.overallHealth?.message}
                            </div>
                          </div>
                        </Stack>

                        <HStack gap={4} my={6} justify={'flex-end'}>
                          <Button
                            variant={'outline'}
                            colorScheme='primaryColor'
                            onClick={() => swiperNestedPrev()}
                          >
                            Back
                          </Button>

                          <Button type='submit' isLoading={isSubmitting}>
                            Complete Sign Up
                          </Button>
                        </HStack>
                      </SwiperSlide>
                    </Swiper>
                  </form>
                )}
                {SelectedUserType === 'nutritionist' && (
                  <Box>
                    <NutritionistForm showModal={false} />
                  </Box>
                )}
              </SwiperSlide>
            </Box>
          </ModalBody>

          <ModalFooter>
            {/* <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant='ghost'>Secondary Action</Button> */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RegisterForm;
